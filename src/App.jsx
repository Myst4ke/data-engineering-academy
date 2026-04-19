import { useState, useEffect, useCallback, useMemo } from 'react';
import { DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { useDraggable } from '@dnd-kit/core';
import TableView from './components/TableView';
import Card from './components/Card';
import Pipeline from './components/Pipeline';
import SuccessModal from './components/SuccessModal';
import HintPopup from './components/HintPopup';
import SolutionPopup from './components/SolutionPopup';
import ParamInputPopup from './components/ParamInputPopup';
import HomeScreen from './components/HomeScreen';
import SandboxImport from './components/SandboxImport';
import Tutorial from './components/Tutorial';
import DojoIntro, { useDojoIntro, DATA_DOJO_INTRO } from './components/DojoIntro';
import { loadExercise, getExerciseList } from './utils/csvParser';
import { getAllCards, getCardDisplayInfo } from './utils/cardDefinitions';
import { applyPipeline, tablesEqual } from './transformations';
import { markExerciseCompleted, saveSolution, getSolution, isExerciseCompleted, saveBestRating, getBestRating } from './utils/progress';
import './index.css';

function DraggableHandCard({ card, children }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `hand-${card.id}`,
    data: { type: 'hand-card', card },
  });

  return (
    <div ref={setNodeRef} {...listeners} {...attributes} style={{ opacity: isDragging ? 0.4 : 1 }}>
      {children}
    </div>
  );
}

function App({ onBackToHub }) {
  const [showDojoIntro, setShowDojoIntro, DojoIntroButton] = useDojoIntro('data-dojo');
  const [view, setView] = useState('home'); // 'home', 'game', 'sandbox'
  const [exercises, setExercises] = useState([]);
  const [currentExerciseId, setCurrentExerciseId] = useState(null);
  const [exerciseData, setExerciseData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [pipeline, setPipeline] = useState([]);
  const [currentTable, setCurrentTable] = useState([]);
  const [animationKey, setAnimationKey] = useState(0);

  const [showSuccess, setShowSuccess] = useState(false);
  const [hasWon, setHasWon] = useState(false);

  // Pending card waiting for params input
  const [pendingCard, setPendingCard] = useState(null);

  // Editing existing card in pipeline
  const [editingCardId, setEditingCardId] = useState(null);
  const [editInitialParams, setEditInitialParams] = useState(null);

  // Insert at specific position
  const [pendingInsertIndex, setPendingInsertIndex] = useState(null);

  // Show saved solution popup
  const [showSolutionPopup, setShowSolutionPopup] = useState(false);
  const [savedSolution, setSavedSolution] = useState(null);

  // Pipeline hover preview
  const [hoveredPipelineIndex, setHoveredPipelineIndex] = useState(null);

  // Sandbox mode
  const [sandboxInput, setSandboxInput] = useState(null);
  const [sandboxSecondTable, setSandboxSecondTable] = useState(null);

  // Tutorial
  const [showTutorial, setShowTutorial] = useState(false);

  // DnD state
  const [activeDragCard, setActiveDragCard] = useState(null);
  const [isOverPipeline, setIsOverPipeline] = useState(false);
  const [handInsertIndex, setHandInsertIndex] = useState(null);

  // DnD sensors
  const pointerSensor = useSensor(PointerSensor, { activationConstraint: { distance: 8 } });
  const touchSensor = useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } });
  const sensors = useSensors(pointerSensor, touchSensor);

  // Tutorial: show on first visit to ex-01
  useEffect(() => {
    if (currentExerciseId === 'ex-01' && view === 'game') {
      const tutorialSeen = localStorage.getItem('dataDojo_tutorialSeen');
      if (!tutorialSeen) {
        setShowTutorial(true);
      }
    }
  }, [currentExerciseId, view]);

  useEffect(() => {
    getExerciseList().then((list) => {
      setExercises(list);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!currentExerciseId) return;

    const loadData = async () => {
      setLoading(true);
      setPipeline([]);
      setHasWon(false);
      setShowSuccess(false);
      setShowSolutionPopup(false);

      // Load saved solution if exists
      const solution = getSolution(currentExerciseId);
      setSavedSolution(solution);

      try {
        const data = await loadExercise(currentExerciseId);
        setExerciseData(data);
        setCurrentTable([...data.inputTable]);

        // Validate saved solution against current data
        if (solution && solution.length > 0) {
          try {
            const solutionCards = solution.map((s, i) =>
              getCardDisplayInfo({ id: `solution-${s.type}-${i}`, type: s.type, params: s.params })
            ).filter(Boolean);
            const resultTable = applyPipeline(data.inputTable, solutionCards, data.secondTable);
            if (!tablesEqual(resultTable, data.outputTable)) {
              setSavedSolution(null);
            }
          } catch {
            setSavedSolution(null);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [currentExerciseId]);

  // Pipeline effect
  useEffect(() => {
    if (view === 'sandbox') {
      if (!sandboxInput) return;
      const newTable = applyPipeline(sandboxInput, pipeline, sandboxSecondTable);
      setCurrentTable(newTable);
      setAnimationKey((k) => k + 1);
      return;
    }

    if (!exerciseData) return;

    const newTable = applyPipeline(
      exerciseData.inputTable,
      pipeline,
      exerciseData.secondTable
    );
    setCurrentTable(newTable);
    setAnimationKey((k) => k + 1);

    if (pipeline.length > 0 && tablesEqual(newTable, exerciseData.outputTable)) {
      if (!hasWon) {
        setHasWon(true);
        markExerciseCompleted(currentExerciseId);
        saveSolution(currentExerciseId, pipeline);
        setSavedSolution(pipeline.map(card => ({ type: card.type, params: card.params || null })));

        // Compute star rating
        const optimal = exerciseData.config?.optimalSteps || pipeline.length;
        let stars = 1;
        if (pipeline.length <= optimal) stars = 3;
        else if (pipeline.length <= optimal + 1) stars = 2;
        saveBestRating(currentExerciseId, stars);

        setTimeout(() => setShowSuccess(true), 600);
      }
    } else {
      setHasWon(false);
    }
  }, [pipeline, exerciseData, hasWon, currentExerciseId, view, sandboxInput, sandboxSecondTable]);

  // Star rating memo
  const starRating = useMemo(() => {
    if (!exerciseData || pipeline.length === 0) return 3;
    const optimal = exerciseData.config?.optimalSteps || pipeline.length;
    if (pipeline.length <= optimal) return 3;
    if (pipeline.length <= optimal + 1) return 2;
    return 1;
  }, [pipeline, exerciseData]);

  // Intermediate table for hover preview
  const intermediateTable = useMemo(() => {
    if (hoveredPipelineIndex === null || !exerciseData) return null;
    const inputTable = view === 'sandbox' ? sandboxInput : exerciseData.inputTable;
    const secondTable = view === 'sandbox' ? sandboxSecondTable : exerciseData.secondTable;
    if (!inputTable) return null;
    const subPipeline = pipeline.slice(0, hoveredPipelineIndex + 1);
    try {
      return applyPipeline(inputTable, subPipeline, secondTable);
    } catch {
      return null;
    }
  }, [hoveredPipelineIndex, pipeline, exerciseData, view, sandboxInput, sandboxSecondTable]);

  const allCards = getAllCards();

  // Check if join/concat card is in pipeline to hide secondary table
  const hasSecondTableUsed = useMemo(() => {
    return pipeline.some((c) => c.type === 'join' || c.type === 'concat');
  }, [pipeline]);

  // Get available columns from current table
  const availableColumns = useMemo(() => {
    if (currentTable && currentTable.length > 0) {
      return Object.keys(currentTable[0]);
    }
    return [];
  }, [currentTable]);

  // Get columns for join (from secondary table)
  const joinColumns = useMemo(() => {
    const secondTable = view === 'sandbox' ? sandboxSecondTable : exerciseData?.secondTable;
    if (secondTable && secondTable.length > 0) {
      const mainCols = currentTable.length > 0 ? Object.keys(currentTable[0]) : [];
      const secondCols = Object.keys(secondTable[0]);
      return mainCols.filter(col => secondCols.includes(col));
    }
    return availableColumns;
  }, [exerciseData?.secondTable, currentTable, availableColumns, view, sandboxSecondTable]);

  const isCardInPipeline = useCallback((cardId) => {
    return pipeline.some((c) => c.id === cardId);
  }, [pipeline]);

  const handleSelectExercise = useCallback((exerciseId) => {
    setCurrentExerciseId(exerciseId);
    setView('game');
  }, []);

  const handleBackToHome = useCallback(() => {
    setView('home');
    setCurrentExerciseId(null);
    setExerciseData(null);
    setPipeline([]);
    setHasWon(false);
    setShowSuccess(false);
    setSandboxInput(null);
    setSandboxSecondTable(null);
  }, []);

  // Sandbox handlers
  const handleSandbox = useCallback(() => {
    setView('sandbox');
    setSandboxInput(null);
    setSandboxSecondTable(null);
    setPipeline([]);
  }, []);

  const handleSandboxImport = useCallback((table, table2) => {
    setSandboxInput(table);
    setSandboxSecondTable(table2);
    setCurrentTable([...table]);
    setPipeline([]);
  }, []);

  const handleAddCard = useCallback((cardInfo) => {
    const needsParams = ['delete', 'filter', 'sort', 'join', 'rename', 'select', 'fill_na', 'concat', 'drop_duplicates', 'delete_na'].includes(cardInfo.type);

    if (needsParams) {
      setPendingCard(cardInfo);
    } else {
      // Cards without params - add directly with unique ID
      const newCard = getCardDisplayInfo({
        id: `${cardInfo.type}-${Date.now()}`,
        type: cardInfo.type,
        params: null,
      });
      if (newCard) {
        setPipeline((prev) => [...prev, newCard]);
      }
    }
  }, []);

  const handleParamConfirm = useCallback((params) => {
    // Editing existing card in pipeline
    if (editingCardId) {
      setPipeline(prev => prev.map(card => {
        if (card.id === editingCardId) {
          return getCardDisplayInfo({
            id: card.id,
            type: card.type,
            params,
          });
        }
        return card;
      }));
      setEditingCardId(null);
      setEditInitialParams(null);
      setPendingCard(null);
      return;
    }

    if (!pendingCard) return;

    const cardWithParams = getCardDisplayInfo({
      id: `${pendingCard.type}-${Date.now()}`,
      type: pendingCard.type,
      params,
    });

    if (pendingInsertIndex !== null) {
      // Insert at specific position
      setPipeline(prev => {
        const newPipeline = [...prev];
        newPipeline.splice(pendingInsertIndex, 0, cardWithParams);
        return newPipeline;
      });
      setPendingInsertIndex(null);
    } else {
      setPipeline((prev) => [...prev, cardWithParams]);
    }
    setPendingCard(null);
  }, [pendingCard, editingCardId, pendingInsertIndex]);

  const handleParamCancel = useCallback(() => {
    setPendingCard(null);
    setEditingCardId(null);
    setEditInitialParams(null);
    setPendingInsertIndex(null);
  }, []);

  const handleEditCard = useCallback((cardInfo) => {
    setEditingCardId(cardInfo.id);
    setEditInitialParams(cardInfo.params);
    setPendingCard(cardInfo);
  }, []);

  const handleRemoveCard = useCallback((cardInfo) => {
    setPipeline((prev) => prev.filter((c) => c.id !== cardInfo.id));
  }, []);

  const handleUndo = useCallback(() => {
    setPipeline(prev => prev.slice(0, -1));
  }, []);

  const handleReset = useCallback(() => {
    setPipeline([]);
    setHasWon(false);
  }, []);

  const handleHoverCard = useCallback((index) => {
    setHoveredPipelineIndex(index);
  }, []);

  const handleLeaveCard = useCallback(() => {
    setHoveredPipelineIndex(null);
  }, []);

  const handleNextExercise = useCallback(() => {
    const currentIndex = exercises.findIndex((e) => e.id === currentExerciseId);
    const nextIndex = (currentIndex + 1) % exercises.length;
    setCurrentExerciseId(exercises[nextIndex].id);
    setShowSuccess(false);
  }, [exercises, currentExerciseId]);

  const handleApplySolution = useCallback((solutionCards) => {
    setPipeline(solutionCards);
  }, []);

  // DnD handlers
  const handleDragStart = useCallback((event) => {
    const { active } = event;
    const data = active.data?.current;
    if (data?.type === 'hand-card') {
      setActiveDragCard(data.card);
    } else {
      // Pipeline card being reordered
      const card = pipeline.find(c => c.id === active.id);
      setActiveDragCard(card || null);
    }
  }, [pipeline]);

  const handleDragOver = useCallback((event) => {
    const { active, over } = event;
    if (!over) {
      setIsOverPipeline(false);
      setHandInsertIndex(null);
      return;
    }

    const activeData = active.data?.current;
    const isHandCard = activeData?.type === 'hand-card';

    if (isHandCard) {
      // Detect if over pipeline area
      const overId = over.id;
      if (overId === 'pipeline-empty' || overId === 'pipeline-start' || overId === 'pipeline-end') {
        setIsOverPipeline(true);
        if (overId === 'pipeline-start') {
          setHandInsertIndex(0);
        } else if (overId === 'pipeline-end' || overId === 'pipeline-empty') {
          setHandInsertIndex(pipeline.length);
        }
      } else {
        // Over a specific pipeline card - detect left/right half
        const overIndex = pipeline.findIndex(c => c.id === overId);
        if (overIndex >= 0) {
          setIsOverPipeline(true);
          const overRect = over.rect;
          if (overRect) {
            const midX = overRect.left + overRect.width / 2;
            const mouseX = event.activatorEvent?.clientX || (overRect.left + overRect.width / 2);
            // Use delta to approximate position
            if (event.delta) {
              const dragX = (event.activatorEvent?.clientX || 0) + event.delta.x;
              setHandInsertIndex(dragX < midX ? overIndex : overIndex + 1);
            } else {
              setHandInsertIndex(overIndex + 1);
            }
          } else {
            setHandInsertIndex(overIndex + 1);
          }
        } else {
          setIsOverPipeline(false);
          setHandInsertIndex(null);
        }
      }
    }
  }, [pipeline]);

  const handleDragCancel = useCallback(() => {
    setActiveDragCard(null);
    setIsOverPipeline(false);
    setHandInsertIndex(null);
  }, []);

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;
    setActiveDragCard(null);
    setIsOverPipeline(false);
    setHandInsertIndex(null);

    if (!over) return;

    const activeData = active.data?.current;
    const isHandCard = activeData?.type === 'hand-card';

    if (isHandCard) {
      // Hand card dropped on pipeline
      const card = activeData.card;
      const insertIdx = handInsertIndex !== null ? handInsertIndex : pipeline.length;

      const needsParams = ['delete', 'filter', 'sort', 'join', 'rename', 'select', 'fill_na', 'concat', 'drop_duplicates', 'delete_na'].includes(card.type);

      if (needsParams) {
        setPendingCard(card);
        setPendingInsertIndex(insertIdx);
      } else {
        const newCard = getCardDisplayInfo({
          id: `${card.type}-${Date.now()}`,
          type: card.type,
          params: null,
        });
        if (newCard) {
          setPipeline(prev => {
            const newPipeline = [...prev];
            newPipeline.splice(insertIdx, 0, newCard);
            return newPipeline;
          });
        }
      }
    } else {
      // Pipeline reorder
      const oldIndex = pipeline.findIndex(c => c.id === active.id);
      const newIndex = pipeline.findIndex(c => c.id === over.id);
      if (oldIndex >= 0 && newIndex >= 0 && oldIndex !== newIndex) {
        setPipeline(prev => arrayMove(prev, oldIndex, newIndex));
      }
    }
  }, [pipeline, handInsertIndex]);

  const handleTutorialComplete = useCallback(() => {
    setShowTutorial(false);
    localStorage.setItem('dataDojo_tutorialSeen', 'true');
  }, []);

  // Check if current exercise was previously completed
  const wasCompleted = currentExerciseId && isExerciseCompleted(currentExerciseId);

  // Show loading while fetching exercise list
  if (loading && exercises.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-xl text-indigo-600 flex items-center gap-3 font-medium">
          <div className="animate-spin w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full" />
          Chargement...
        </div>
      </div>
    );
  }

  // Home screen
  if (view === 'home') {
    return (<>
      <HomeScreen
        exercises={exercises}
        onSelectExercise={handleSelectExercise}
        onSandbox={handleSandbox}
        onBackToHub={onBackToHub}
        introButton={<DojoIntroButton />}
      />
      {showDojoIntro && <DojoIntro {...DATA_DOJO_INTRO} onClose={() => setShowDojoIntro(false)} />}
    </>);
  }

  // Sandbox import screen
  if (view === 'sandbox' && sandboxInput === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={handleBackToHome}
              className="game-btn px-3 py-1.5 text-sm font-semibold"
            >
              Accueil
            </button>
            <h1 className="text-xl font-bold text-indigo-600">Bac a sable</h1>
          </div>
          <SandboxImport onImport={handleSandboxImport} onCancel={handleBackToHome} />
        </div>
      </div>
    );
  }

  // Loading exercise data
  if (loading && view === 'game') {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-xl text-indigo-600 flex items-center gap-3 font-medium">
          <div className="animate-spin w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full" />
          Chargement...
        </div>
      </div>
    );
  }

  const secondTable = view === 'sandbox' ? sandboxSecondTable : exerciseData?.secondTable;

  return (
    <div className="game-view flex flex-col p-2 sm:p-3 gap-2 relative z-10 pb-4">
      {/* HEADER */}
      <div className="flex-none flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={handleBackToHome}
            className="game-btn px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-semibold flex items-center gap-1"
          >
            <span className="hidden sm:inline">Accueil</span>
            <span className="sm:hidden">&lt;</span>
          </button>
          <h1 className="text-base sm:text-xl font-bold text-indigo-600 tracking-wide">
            {view === 'sandbox' ? 'BAC A SABLE' : 'DATA DOJO'}
          </h1>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="text-slate-600 text-xs sm:text-sm font-medium hidden sm:block">
            {view === 'sandbox' ? 'Mode libre' : exerciseData?.config?.title}
          </span>
          {/* Show solution button if exercise was completed before */}
          {view === 'game' && wasCompleted && savedSolution && savedSolution.length > 0 && (
            <button
              onClick={() => setShowSolutionPopup(true)}
              className="game-btn px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-semibold flex items-center gap-1 text-emerald-600"
              title="Voir ma solution precedente"
            >
              <span className="hidden sm:inline">Solution</span>
            </button>
          )}
          {view === 'game' && <div data-tutorial="hint-btn"><HintPopup hint={exerciseData?.config?.hint} /></div>}
        </div>
      </div>

      {/* TABLES - Stack on mobile, row on desktop */}
      <div className="flex-none grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-3">
        {/* Current Table */}
        <div data-tutorial="current-table">
          <TableView
            data={currentTable}
            title="Table Actuelle"
            animating={animationKey > 1}
            isSuccess={hasWon}
          />
        </div>

        {/* Second Table (for join/concat) - hide when used */}
        {secondTable && !hasSecondTableUsed ? (
          <TableView
            data={secondTable}
            title="Table Secondaire"
          />
        ) : view === 'game' ? (
          <div className="hidden md:block" />
        ) : null}

        {/* Target Table */}
        {view === 'game' && (
          <div data-tutorial="target-table">
            <TableView
              data={exerciseData?.outputTable}
              title="Objectif"
              isTarget
            />
          </div>
        )}
      </div>

      {/* PIPELINE + HAND with DnD context */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragCancel={handleDragCancel}
        onDragEnd={handleDragEnd}
      >
        {/* PIPELINE */}
        <div className="flex-1 min-h-[80px] sm:min-h-[100px] md:min-h-[150px]">
          <Pipeline
            cards={pipeline}
            onRemoveCard={handleRemoveCard}
            onReset={handleReset}
            onEditCard={handleEditCard}
            onUndo={handleUndo}
            onHoverCard={handleHoverCard}
            onLeaveCard={handleLeaveCard}
            hoveredIndex={hoveredPipelineIndex}
            intermediateTable={intermediateTable}
            isOverPipeline={isOverPipeline}
            handInsertIndex={handInsertIndex}
          />
        </div>

        {/* CARDS HAND - Horizontal scroll on mobile, fan on desktop */}
        <div className="flex-none pb-2" data-tutorial="hand">
          {/* Mobile: horizontal scroll */}
          <div className="flex md:hidden overflow-x-auto gap-2 pb-2 px-1 snap-x snap-mandatory">
            {allCards.map((card) => (
              <DraggableHandCard key={card.id} card={card}>
                <div className="flex-shrink-0 snap-center">
                  <Card
                    cardInfo={card}
                    onClick={handleAddCard}
                    disabled={false}
                    small
                  />
                </div>
              </DraggableHandCard>
            ))}
          </div>

          {/* Desktop: fanned cards */}
          <div className="hidden md:flex items-end justify-center h-[160px]">
            <div className="flex items-end gap-2">
              {allCards.map((card, index) => {
                const rotation = (index - (allCards.length - 1) / 2) * 4;
                const yOffset = Math.abs(index - (allCards.length - 1) / 2) * 8;

                return (
                  <DraggableHandCard key={card.id} card={card}>
                    <div
                      style={{
                        transform: `rotate(${rotation}deg) translateY(${yOffset}px)`,
                        transition: 'all 0.2s ease',
                      }}
                      className="hover:!-translate-y-6 hover:!rotate-0 hover:z-10"
                    >
                      <Card
                        cardInfo={card}
                        onClick={handleAddCard}
                        disabled={false}
                      />
                    </div>
                  </DraggableHandCard>
                );
              })}
            </div>
          </div>
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeDragCard ? (
            <Card
              cardInfo={activeDragCard}
              disabled={false}
              size="small"
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* SUCCESS MODAL */}
      {view === 'game' && (
        <SuccessModal
          isOpen={showSuccess}
          onClose={() => setShowSuccess(false)}
          onNextExercise={handleNextExercise}
          exerciseTitle={exerciseData?.config?.title}
          starRating={starRating}
          cardCount={pipeline.length}
          optimalSteps={exerciseData?.config?.optimalSteps || 0}
        />
      )}

      {/* PARAM INPUT POPUP */}
      {pendingCard && (
        <ParamInputPopup
          cardType={pendingCard.type}
          cardName={pendingCard.name}
          cardIcon={pendingCard.icon}
          columns={pendingCard.type === 'join' ? joinColumns : availableColumns}
          tableData={currentTable}
          onConfirm={handleParamConfirm}
          onCancel={handleParamCancel}
          initialParams={editInitialParams}
        />
      )}

      {/* SOLUTION POPUP */}
      {showSolutionPopup && savedSolution && (
        <SolutionPopup
          solution={savedSolution}
          onClose={() => setShowSolutionPopup(false)}
          onApply={handleApplySolution}
        />
      )}

      {/* TUTORIAL */}
      {showTutorial && <Tutorial onComplete={handleTutorialComplete} />}
    </div>
  );
}

export default App;
