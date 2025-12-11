import { useState, useEffect, useCallback, useMemo } from 'react';
import TableView from './components/TableView';
import Card from './components/Card';
import Pipeline from './components/Pipeline';
import SuccessModal from './components/SuccessModal';
import HintPopup from './components/HintPopup';
import ParamInputPopup from './components/ParamInputPopup';
import { loadExercise, getExerciseList } from './utils/csvParser';
import { getAllCards, getCardDisplayInfo } from './utils/cardDefinitions';
import { applyPipeline, tablesEqual } from './transformations';
import './index.css';

function App() {
  const [exercises, setExercises] = useState([]);
  const [currentExerciseId, setCurrentExerciseId] = useState('exercice-1');
  const [exerciseData, setExerciseData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [pipeline, setPipeline] = useState([]);
  const [currentTable, setCurrentTable] = useState([]);
  const [animationKey, setAnimationKey] = useState(0);

  const [showSuccess, setShowSuccess] = useState(false);
  const [hasWon, setHasWon] = useState(false);

  // Pending card waiting for params input
  const [pendingCard, setPendingCard] = useState(null);

  useEffect(() => {
    getExerciseList().then(setExercises);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setPipeline([]);
      setHasWon(false);
      setShowSuccess(false);

      try {
        const data = await loadExercise(currentExerciseId);
        setExerciseData(data);
        setCurrentTable([...data.inputTable]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [currentExerciseId]);

  useEffect(() => {
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
        setTimeout(() => setShowSuccess(true), 600);
      }
    } else {
      setHasWon(false);
    }
  }, [pipeline, exerciseData, hasWon]);

  const allCards = getAllCards();

  // Check if join card is in pipeline to hide secondary table
  const hasJoinInPipeline = useMemo(() => {
    return pipeline.some((c) => c.type === 'join');
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
    if (exerciseData?.secondTable && exerciseData.secondTable.length > 0) {
      const mainCols = currentTable.length > 0 ? Object.keys(currentTable[0]) : [];
      const secondCols = Object.keys(exerciseData.secondTable[0]);
      // Return only common columns
      return mainCols.filter(col => secondCols.includes(col));
    }
    return availableColumns;
  }, [exerciseData?.secondTable, currentTable, availableColumns]);

  const isCardInPipeline = useCallback((cardId) => {
    return pipeline.some((c) => c.id === cardId);
  }, [pipeline]);

  const handleAddCard = useCallback((cardInfo) => {
    // Cards that need params: delete, filter, sort, join
    const needsParams = ['delete', 'filter', 'sort', 'join'].includes(cardInfo.type);

    // Always show popup for cards that need params (user configures every time)
    if (needsParams) {
      setPendingCard(cardInfo);
    } else {
      // Cards without params (drop_duplicates, delete_na) - add directly
      setPipeline((prev) => {
        if (prev.some((c) => c.id === cardInfo.id)) return prev;
        return [...prev, cardInfo];
      });
    }
  }, []);

  const handleParamConfirm = useCallback((params) => {
    if (!pendingCard) return;

    // Create new card with params
    const cardWithParams = getCardDisplayInfo({
      id: `${pendingCard.type}-${Date.now()}`,
      type: pendingCard.type,
      params,
    });

    setPipeline((prev) => [...prev, cardWithParams]);
    setPendingCard(null);
  }, [pendingCard]);

  const handleParamCancel = useCallback(() => {
    setPendingCard(null);
  }, []);

  const handleRemoveCard = useCallback((cardInfo) => {
    setPipeline((prev) => prev.filter((c) => c.id !== cardInfo.id));
  }, []);

  const handleReset = useCallback(() => {
    setPipeline([]);
    setHasWon(false);
  }, []);

  const handleNextExercise = useCallback(() => {
    const currentIndex = exercises.findIndex((e) => e.id === currentExerciseId);
    const nextIndex = (currentIndex + 1) % exercises.length;
    setCurrentExerciseId(exercises[nextIndex].id);
    setShowSuccess(false);
  }, [exercises, currentExerciseId]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-xl text-indigo-600 flex items-center gap-3 font-medium">
          <div className="animate-spin w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full" />
          Chargement...
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col p-3 gap-2 relative z-10">
      {/* HEADER */}
      <div className="flex-none flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-indigo-600 tracking-wide">
            🎴 DATA TRANSFORM
          </h1>
          <select
            value={currentExerciseId}
            onChange={(e) => setCurrentExerciseId(e.target.value)}
            className="game-btn px-3 py-1.5 text-sm cursor-pointer"
          >
            {exercises.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {'⭐'.repeat(ex.difficulty)} {ex.title}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-slate-600 text-sm font-medium">
            {exerciseData?.config?.title}
          </span>
          <HintPopup hint={exerciseData?.config?.hint} />
        </div>
      </div>

      {/* TABLES ROW */}
      <div className="flex-none grid grid-cols-3 gap-3">
        {/* Current Table */}
        <TableView
          data={currentTable}
          title="Table Actuelle"
          animating={animationKey > 1}
          isSuccess={hasWon}
        />

        {/* Second Table (for join) - hide when join is applied */}
        {exerciseData?.secondTable && !hasJoinInPipeline ? (
          <TableView
            data={exerciseData.secondTable}
            title="Table Secondaire"
          />
        ) : (
          <div />
        )}

        {/* Target Table */}
        <TableView
          data={exerciseData?.outputTable}
          title="Objectif"
          isTarget
        />
      </div>

      {/* PIPELINE */}
      <div className="flex-1 min-h-[220px]">
        <Pipeline
          cards={pipeline}
          onRemoveCard={handleRemoveCard}
          onReset={handleReset}
        />
      </div>

      {/* CARDS HAND */}
      <div className="flex-none flex items-end justify-center pb-1 h-[180px]">
        <div className="flex items-end gap-2">
          {allCards.map((card, index) => {
            const isUsed = isCardInPipeline(card.id);
            const rotation = (index - (allCards.length - 1) / 2) * 5;
            const yOffset = Math.abs(index - (allCards.length - 1) / 2) * 12;

            return (
              <div
                key={card.id}
                style={{
                  transform: `rotate(${rotation}deg) translateY(${yOffset}px)`,
                  transition: 'all 0.2s ease',
                }}
                className="hover:!-translate-y-6 hover:!rotate-0 hover:z-10"
              >
                <Card
                  cardInfo={card}
                  onClick={handleAddCard}
                  disabled={isUsed}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* SUCCESS MODAL */}
      <SuccessModal
        isOpen={showSuccess}
        onClose={() => setShowSuccess(false)}
        onNextExercise={handleNextExercise}
        exerciseTitle={exerciseData?.config?.title}
      />

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
        />
      )}
    </div>
  );
}

export default App;
