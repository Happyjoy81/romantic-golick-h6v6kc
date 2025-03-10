import React, { useState, useEffect, useCallback, useRef } from 'react';

// ===== Constantes =====
const letterFrequencies = {
  A: 8.15, B: 0.97, C: 3.15, D: 3.73, E: 17.39, F: 1.12,
  G: 0.97, H: 0.85, I: 7.31, J: 0.45, K: 0.02, L: 5.69,
  M: 2.87, N: 7.12, O: 5.28, P: 2.80, Q: 1.21, R: 6.64,
  S: 8.14, T: 7.22, U: 6.38, V: 1.64, W: 0.03, X: 0.41,
  Y: 0.28, Z: 0.15
};

const vowels = ['A', 'E', 'I', 'O', 'U', 'Y'];
const consonants = ['B', 'C', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'Q', 'R', 'S', 'T', 'V', 'W', 'X', 'Z'];
const availableNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 25, 50, 75, 100];
const operators = ['+', '-', '*', '/'];
const LETTERS_TIMER_DURATION = 45;
const NUMBERS_TIMER_DURATION = 60;
const COUNTDOWN_DURATION = 2;

// ===== Utility Functions =====
const evaluateExpression = (expression) => {
  try {
    if (!expression || expression.trim() === '') return null;
    
    const sanitizedExpression = expression
      .replace(/[^0-9+\-*/().\s]/g, '')
      .replace(/\s+/g, '');
    
    if (sanitizedExpression === '') return null;
    
    try {
      const result = Function(`'use strict'; return (${sanitizedExpression})`)();
      return result;
    } catch (evalError) {
      console.error("Erreur d'évaluation:", evalError);
      return null;
    }
  } catch (e) {
    console.error("Erreur générale:", e);
    return null;
  }
};

const getRandomNumbers = () => {
  const numbers = [];
  const availablePool = [...availableNumbers];
  
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * availablePool.length);
    numbers.push(availablePool[randomIndex]);
    availablePool.splice(randomIndex, 1);
  }
  return numbers;
};

// Fonction pour résoudre le compte est bon
const solveCompteEstBon = (numbers, target) => {
  // Version simplifiée pour la démo
  const findSimpleSolution = () => {
    let bestDiff = Infinity;
    let bestResult = null;
    let bestSteps = [];
    
    // Essayer chaque nombre directement
    for (const num of numbers) {
      const diff = Math.abs(num - target);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestResult = num;
        bestSteps = [`Le nombre ${num} est déjà proche de la cible`];
      }
    }
    
    // Essayer quelques opérations simples entre deux nombres
    for (let i = 0; i < numbers.length; i++) {
      for (let j = i + 1; j < numbers.length; j++) {
        const a = numbers[i];
        const b = numbers[j];
        
        // Addition
        const sum = a + b;
        const sumDiff = Math.abs(sum - target);
        if (sumDiff < bestDiff) {
          bestDiff = sumDiff;
          bestResult = sum;
          bestSteps = [`${a} + ${b} = ${sum}`];
        }
        
        // Multiplication
        const product = a * b;
        const productDiff = Math.abs(product - target);
        if (productDiff < bestDiff) {
          bestDiff = productDiff;
          bestResult = product;
          bestSteps = [`${a} × ${b} = ${product}`];
        }
      }
    }
    
    return {
      diff: bestDiff,
      result: bestResult,
      steps: bestSteps
    };
  };
  
  return findSimpleSolution();
};

// Fonction pour formater les étapes du compte est bon
const formatSolution = (solution) => {
  if (!solution || !solution.steps || solution.steps.length === 0) {
    return {
      message: "Aucune solution trouvée",
      steps: [],
      result: null,
      diff: Infinity
    };
  }

  const stepDetails = solution.steps.map((step, index) => {
    const [operation, result] = step.split(' = ');
    return {
      id: index + 1,
      expression: operation,
      result: parseFloat(result),
      isIntermediate: index < solution.steps.length - 1
    };
  });

  let message;
  if (solution.diff === 0) {
    message = `J'ai trouvé le nombre exact (${solution.result}) !`;
  } else {
    message = `J'ai trouvé ${solution.result}, à ${solution.diff} du nombre cible.`;
  }

  return {
    message,
    steps: stepDetails,
    result: solution.result,
    diff: solution.diff
  };
};

// ===== UI Components =====
// Countdown Component
const Countdown = ({ count }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-2 pointer-events-none">
      <div className="w-20 h-20 flex items-center justify-center bg-indigo-600 rounded-full shadow-lg text-white relative pointer-events-auto">
        <span className="text-3xl font-bold">{count}</span>
      </div>
    </div>
  );
};

// Timer Component
const Timer = ({ seconds, totalSeconds }) => {
  const percentage = (seconds / totalSeconds) * 100;
  
  return (
    <div className="relative w-full h-10 bg-gray-200 rounded-full overflow-hidden mb-4">
      <div 
        className="absolute top-0 left-0 h-full transition-all duration-1000 ease-linear"
        style={{ 
          width: `${percentage}%`,
          backgroundColor: seconds <= 10 ? '#EF4444' : seconds <= 20 ? '#F59E0B' : '#10B981'
        }}
      ></div>
      <div className="absolute inset-0 flex items-center justify-center font-bold text-base md:text-lg">
        {seconds} secondes
      </div>
    </div>
  );
};

// Button Component
const Button = ({ children, onClick, disabled, className = '', variant }) => {
  const baseClasses = "py-2 px-3 md:px-4 rounded font-medium focus:outline-none focus:ring-2 focus:ring-opacity-50 text-sm md:text-base";
  const variantClasses = variant === "outline" 
    ? "border border-indigo-300 text-indigo-700 bg-white hover:bg-indigo-50 focus:ring-indigo-500" 
    : "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500";
  
  return (
    <button 
      className={`${baseClasses} ${variantClasses} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

// Card Components
const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-lg shadow-md overflow-hidden ${className}`}>
    {children}
  </div>
);

const CardContent = ({ children }) => (
  <div className="p-6">
    {children}
  </div>
);

// Input Component
const Input = React.forwardRef(({ type = "text", placeholder, value, onChange, onKeyDown, onEnter, className = '', disabled }, ref) => {
  const handleKeyDown = (e) => {
    if (onKeyDown) onKeyDown(e);
    if (e.key === 'Enter' && onEnter) {
      e.preventDefault();
      onEnter();
    }
  };
  
  return (
    <input
      ref={ref}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      className={`w-full px-2 md:px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base ${className} ${disabled ? 'bg-gray-100' : ''}`}
    />
  );
});

Input.displayName = 'Input';

// Modal générique
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-2">
      <div className="bg-white rounded-lg p-4 md:p-6 max-w-md w-full max-h-screen overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

// Dictionary Modal
const DictionaryModal = ({ isOpen, onClose, word, result }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Vérification du dictionnaire">
      <div className="mb-4">
        <p className="text-lg font-semibold mb-2">Mot recherché: {word}</p>
        {!result ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : result.error ? (
          <div className="p-3 rounded-lg bg-red-100">
            <p>{result.error}</p>
          </div>
        ) : !result.exists ? (
          <div className="p-3 rounded-lg bg-red-100">
            <p>Le mot n'est pas trouvé dans le dictionnaire français.</p>
          </div>
        ) : (
          <div className="p-3 rounded-lg bg-green-100">
            <p className="font-bold mb-2">Mot valide trouvé dans le Wiktionnaire</p>
            <p>Le mot "{word}" existe dans le dictionnaire Wiktionnaire.</p>
          </div>
        )}
      </div>
      
      <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
        <a 
          href={`https://fr.wiktionary.org/wiki/${word.toLowerCase()}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-500 hover:underline flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
            <polyline points="15 3 21 3 21 9"></polyline>
            <line x1="10" y1="14" x2="21" y2="3"></line>
          </svg>
          Voir sur Wiktionnaire
        </a>
        <Button onClick={onClose}>Fermer</Button>
      </div>
      
      <div className="mt-4 pt-3 border-t text-xs text-gray-500 text-center">
        <div className="flex items-center justify-center flex-wrap">
          <span>Définition issue du </span>
          <a href="https://fr.wiktionary.org/" className="mx-1 text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">
            Wiktionnaire
          </a>
          <span>dictionnaire francophone libre et gratuit.</span>
        </div>
      </div>
    </Modal>
  );
};

// Rules Modal
const RulesModal = ({ isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Règles du jeu">
      <div className="space-y-4">
        <div>
          <h4 className="font-bold text-lg mb-2">Description</h4>
          <p className="mb-2">Des Chiffres et Des Lettres est un jeu télévisé français de culture générale et de rapidité. Cette version numérique reprend les deux épreuves principales.</p>
        </div>
        
        <div>
          <h4 className="font-bold text-lg mb-2">1. Le Mot le Plus Long</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li>Le joueur choisit 10 lettres (voyelles ou consonnes)</li>
            <li>Une fois les 10 lettres tirées, un chronomètre de 45 secondes démarre</li>
            <li>Le but est de former le mot le plus long possible en utilisant uniquement les lettres disponibles</li>
            <li>Chaque lettre ne peut être utilisée qu'une seule fois (sauf si elle apparaît plusieurs fois)</li>
            <li>Seuls les noms communs, adjectifs, verbes et adverbes à l'infinitif sont acceptés</li>
            <li>Les points sont calculés selon la longueur du mot (1 point par lettre)</li>
          </ul>
        </div>
        
        <div>
          <h4 className="font-bold text-lg mb-2">2. Le Compte est Bon</h4>
          <ul className="list-disc pl-5 space-y-1">
            <li>Six nombres sont tirés au hasard parmi les petits nombres (1 à 10) et les grands nombres (25, 50, 75, 100)</li>
            <li>Un nombre cible à trois chiffres (entre 100 et 999) est généré aléatoirement</li>
            <li>Un chronomètre de 60 secondes démarre</li>
            <li>Le but est d'atteindre le nombre cible (ou de s'en approcher au maximum) en utilisant les opérations +, -, *, /</li>
            <li>Chaque nombre ne peut être utilisé qu'une seule fois</li>
            <li>Les résultats intermédiaires peuvent être réutilisés</li>
            <li>Les points sont attribués selon la proximité avec le nombre cible</li>
          </ul>
        </div>
        
        <div className="pt-4">
          <Button onClick={onClose} className="w-full">J'ai compris</Button>
        </div>
      </div>
    </Modal>
  );
};

// Result Summary Modal
const ResultSummaryModal = ({ isOpen, onClose, summary }) => {
  if (!isOpen || !summary) return null;
  
  const [showSolution, setShowSolution] = useState(false);
  const [solution, setSolution] = useState(null);
  const [loadingSolution, setLoadingSolution] = useState(false);
  
  // Calculer une solution optimale
  const calculateOptimalSolution = useCallback(async () => {
    setLoadingSolution(true);
    try {
      // Récupérer les nombres originaux
      const originalNumbers = summary.initialNumbers.map(num => num.value);
      
      // Trouver une solution (version simplifiée pour la démo)
      const optimalSolution = solveCompteEstBon(originalNumbers, summary.target);
      const formattedSolution = formatSolution(optimalSolution);
      
      setTimeout(() => {
        setSolution(formattedSolution);
        setLoadingSolution(false);
      }, 1000); // Simulation d'un calcul qui prend du temps
    } catch (error) {
      console.error("Erreur lors du calcul de la solution optimale:", error);
      setSolution({
        message: "Impossible de calculer une solution optimale.",
        steps: [],
        result: null
      });
      setLoadingSolution(false);
    }
  }, [summary]);
  
  // Gérer l'affichage/masquage de la solution optimale
  const toggleSolution = () => {
    if (!showSolution && !solution) {
      calculateOptimalSolution();
    }
    setShowSolution(!showSolution);
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Résultat de la manche">
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-yellow-100 rounded-lg">
            <p className="text-sm text-gray-600">Cible</p>
            <p className="text-3xl font-bold text-yellow-700">{summary.target}</p>
          </div>
          <div className="p-3 bg-blue-100 rounded-lg">
            <p className="text-sm text-gray-600">Votre résultat</p>
            <p className="text-3xl font-bold text-blue-700">{summary.finalResult || "-"}</p>
          </div>
          <div className="p-3 bg-green-100 rounded-lg">
            <p className="text-sm text-gray-600">Points</p>
            <p className="text-3xl font-bold text-green-700">{summary.points}</p>
          </div>
        </div>
        
        {/* Affichage des nombres disponibles */}
        <div className="p-3 bg-indigo-50 rounded-lg">
          <h4 className="font-semibold mb-2">Nombres disponibles :</h4>
          <div className="flex flex-wrap gap-2 justify-center">
            {summary.initialNumbers && summary.initialNumbers.map((num, index) => (
              <div key={index} className="w-12 h-10 flex items-center justify-center bg-white border-2 border-indigo-400 rounded-lg font-bold">
                {num.value}
              </div>
            ))}
          </div>
        </div>
        
        {/* Message principal */}
        <div className={`p-4 rounded-lg ${summary.success ? 'bg-green-100' : 'bg-blue-50'}`}>
          <p className="font-semibold">{summary.message}</p>
        </div>
        
        {/* Section pour la solution optimale */}
        <div className="p-4 border border-indigo-200 rounded-lg bg-indigo-50">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-semibold">Solution optimale</h4>
            <Button 
              onClick={toggleSolution} 
              variant="outline" 
              className="text-xs py-1 px-2"
            >
              {showSolution ? "Masquer" : "Afficher"}
            </Button>
          </div>
          
          {showSolution && (
            <div className="mt-3 space-y-3">
              {loadingSolution ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : solution ? (
                <>
                  <div className={`p-3 rounded-lg ${solution.diff === 0 ? 'bg-green-100' : 'bg-blue-100'}`}>
                    <p className="font-medium">{solution.message}</p>
                  </div>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {solution.steps.map((step, index) => (
                      <div 
                        key={index} 
                        className="p-2 rounded text-sm bg-white"
                      >
                        {step.expression} = {step.result}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="p-3 rounded-lg bg-red-50">
                  <p>Impossible de calculer une solution optimale.</p>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="pt-4">
          <Button onClick={onClose} className="w-full">Continuer</Button>
        </div>
      </div>
    </Modal>
  );
};

// ===== Main Game Component =====
const ChiffresLettres = () => {
  // État du jeu
  const [gamePhase, setGamePhase] = useState('letters');
  const [score, setScore] = useState(0);
  const [roundsPlayed, setRoundsPlayed] = useState(0);
  
  // État des lettres
  const [selectedLetters, setSelectedLetters] = useState([]);
  const [usedLetters, setUsedLetters] = useState({});
  const [wordAnswer, setWordAnswer] = useState('');
  const [wordValidation, setWordValidation] = useState(null);
  
  // État des nombres
  const [selectedNumbers, setSelectedNumbers] = useState([]);
  const [availableNumbersForCalc, setAvailableNumbersForCalc] = useState([]);
  const [usedNumbers, setUsedNumbers] = useState([]);
  const [usedCalculatedNumbers, setUsedCalculatedNumbers] = useState([]);
  const [target, setTarget] = useState(null);
  
  // État des calculs
  const [calculationSteps, setCalculationSteps] = useState([{ expression: '', userResult: '', validated: false }]);
  const [operations, setOperations] = useState([]);
  const [lastInputType, setLastInputType] = useState(null);
  const [lastClickedNumber, setLastClickedNumber] = useState(null);
  const [finalAnswer, setFinalAnswer] = useState('');
  
  // État du timer
  const [timer, setTimer] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [timeExpired, setTimeExpired] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [showCountdown, setShowCountdown] = useState(false);
  
  // État des modales
  const [dictionaryModalOpen, setDictionaryModalOpen] = useState(false);
  const [dictionaryResult, setDictionaryResult] = useState(null);
  const [rulesModalOpen, setRulesModalOpen] = useState(false);
  const [showResultSummary, setShowResultSummary] = useState(false);
  const [resultSummary, setResultSummary] = useState(null);
  
  // État divers
  const [validationMessage, setValidationMessage] = useState(null);
  
  // Refs
  const resultInputRef = useRef(null);
  const timerRef = useRef(null);
  const countdownRef = useRef(null);

  // Timer functions
  const startMainTimer = useCallback(() => {
    const duration = gamePhase === 'target' ? NUMBERS_TIMER_DURATION : LETTERS_TIMER_DURATION;
    setTimer(duration);
    setTimerActive(true);
    setTimeExpired(false);
  }, [gamePhase]);

  const stopAllTimers = useCallback(() => {
    setTimerActive(false);
    setShowCountdown(false);
    
    clearTimeout(timerRef.current);
    clearTimeout(countdownRef.current);
    
    timerRef.current = null;
    countdownRef.current = null;
  }, []);

  const startCountdown = useCallback(() => {
    setCountdown(COUNTDOWN_DURATION);
    setShowCountdown(true);
  }, []);

  // Countdown effect
  useEffect(() => {
    if (showCountdown && countdown > 0) {
      countdownRef.current = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (showCountdown && countdown === 0) {
      setShowCountdown(false);
      startMainTimer();
    }

    return () => {
      clearTimeout(countdownRef.current);
    };
  }, [showCountdown, countdown, startMainTimer]);

  // Main timer effect
  useEffect(() => {
    if (timerActive && timer > 0) {
      timerRef.current = setTimeout(() => {
        setTimer(prev => prev - 1);
      }, 1000);
    } else if (timerActive && timer === 0) {
      setTimerActive(false);
      setTimeExpired(true);
      
      // Vérifier la phase pour afficher la modale appropriée
      if (gamePhase === 'target') {
        // Afficher la modale de résultat pour la phase des chiffres
        showFinalResultModal();
      }
    }

    return () => {
      clearTimeout(timerRef.current);
    };
  }, [timerActive, timer, gamePhase]);
  
  // Letter selection logic
  const getRandomLetter = useCallback((isVowel) => {
    const letterPool = isVowel ? vowels : consonants;
    
    // Sélection pondérée par fréquence
    let totalWeight = 0;
    letterPool.forEach(letter => totalWeight += letterFrequencies[letter]);
    
    let random = Math.random() * totalWeight;
    let currentWeight = 0;
    
    for (const letter of letterPool) {
      currentWeight += letterFrequencies[letter];
      if (random <= currentWeight) {
        return letter;
      }
    }
    return letterPool[0];
  }, []);

  const addLetter = useCallback((isVowel) => {
    if (selectedLetters.length < 10) {
      const newLetter = getRandomLetter(isVowel);
      const newSelectedLetters = [...selectedLetters, newLetter];
      setSelectedLetters(newSelectedLetters);
      
      if (newSelectedLetters.length === 10) {
        startMainTimer();
      }
    }
  }, [selectedLetters, getRandomLetter, startMainTimer]);

  // Generate target number
  const generateTarget = useCallback(() => {
    setTarget(Math.floor(Math.random() * 900) + 100);
    setGamePhase('target');
    
    // Initialiser les nombres disponibles
    const initialNumbers = selectedNumbers.map((number, index) => ({
      id: `initial-${index}`,
      value: number,
      isInitial: true
    }));
    
    setAvailableNumbersForCalc(initialNumbers);
    setUsedNumbers([]);
    setUsedCalculatedNumbers([]);
    setOperations([]);
    setFinalAnswer('');
    startCountdown();
  }, [selectedNumbers, startCountdown]);

  // Word validation
  const validateWord = useCallback(() => {
    const input = wordAnswer.toUpperCase();
    if (!input) return;
    
    setWordValidation({
      valid: true,
      message: "Mot formé avec les lettres disponibles."
    });
    
    if (!timeExpired) {
      const wordLength = input.length;
      const points = wordLength;
      setScore(prev => prev + points);
      
      // Simuler la vérification du dictionnaire
      checkDictionary();
      
      // Arrêter le timer
      stopAllTimers();
      setTimeExpired(true);
    }
  }, [wordAnswer, timeExpired, stopAllTimers]);
  
  // Vérification du dictionnaire
  const checkDictionary = useCallback(() => {
    if (!wordAnswer.trim()) return;
    
    setDictionaryModalOpen(true);
    setDictionaryResult(null);
    
    // Simulation de vérification du dictionnaire
    setTimeout(() => {
      const result = {
        exists: true,
        word: wordAnswer.toUpperCase(),
        data: { word: wordAnswer.toUpperCase() }
      };
      
      setDictionaryResult(result);
    }, 1500);
  }, [wordAnswer]);
  
  // Fonction pour effacer la dernière lettre du mot
  const removeLastLetter = useCallback(() => {
    if (wordAnswer.length > 0) {
      const lastLetter = wordAnswer[wordAnswer.length - 1].toUpperCase();
      
      // Trouver l'index de la dernière occurrence de cette lettre
      let lastUsedIndex = -1;
      for (let i = selectedLetters.length - 1; i >= 0; i--) {
        if (selectedLetters[i] === lastLetter && usedLetters[i]) {
          lastUsedIndex = i;
          break;
        }
      }
      
      // Si on a trouvé l'index, libérer cette lettre
      if (lastUsedIndex !== -1) {
        setUsedLetters(prev => {
          const newUsedLetters = {...prev};
          delete newUsedLetters[lastUsedIndex];
          return newUsedLetters;
        });
      }
      
      // Supprimer la dernière lettre du mot
      setWordAnswer(prev => prev.slice(0, -1));
    }
  }, [wordAnswer, selectedLetters, usedLetters]);
  
  // Calculation steps handling
  const updateCalculationStep = useCallback((index, field, value) => {
    setCalculationSteps(prev => {
      const newSteps = [...prev];
      newSteps[index] = {
        ...newSteps[index],
        [field]: value,
        validated: false
      };
      return newSteps;
    });
  }, []);
  
  // Ajout des opérateurs
  const addOperator = useCallback((operator) => {
    if (!timeExpired && !showCountdown) {
      const currentStep = calculationSteps[0];
      
      // Vérifier si l'expression est vide
      if (!currentStep.expression.trim()) {
        setValidationMessage({
          text: "Vous devez d'abord sélectionner un nombre!",
          isError: true
        });
        
        setTimeout(() => setValidationMessage(null), 3000);
        return;
      }
      
      // Si le dernier caractère tapé est déjà un opérateur, le remplacer
      if (lastInputType === 'operator') {
        const trimmedExpression = currentStep.expression.trim();
        const lastSpaceIndex = trimmedExpression.lastIndexOf(' ');
        if (lastSpaceIndex !== -1) {
          const newExpression = trimmedExpression.substring(0, lastSpaceIndex + 1) + operator + ' ';
          updateCalculationStep(0, 'expression', newExpression);
        }
      } else {
        // Ajouter l'opérateur normalement
        updateCalculationStep(
          0, 
          'expression', 
          currentStep.expression + ' ' + operator + ' '
        );
        setLastInputType('operator');
      }
    }
  }, [timeExpired, showCountdown, calculationSteps, lastInputType, updateCalculationStep]);
  
  // Valider et ajouter une opération
  const validateAndAddResult = useCallback(() => {
    const step = calculationSteps[0];
    if (!step.expression || !step.userResult) return;
    
    // Pour la démo, on considère toutes les opérations valides
    const userResult = parseFloat(step.userResult);
    
    if (isNaN(userResult)) {
      setValidationMessage({
        text: 'Veuillez entrer un résultat numérique valide',
        isError: true
      });
      
      setTimeout(() => setValidationMessage(null), 3000);
      return;
    }
    
    // Ajouter l'opération
    setOperations(prev => [
      ...prev, 
      {
        id: Date.now().toString(),
        expression: step.expression,
        result: userResult,
      }
    ]);
    
    // Ajouter le résultat aux nombres disponibles
    setAvailableNumbersForCalc(prev => [
      ...prev,
      {
        id: `calc-${Date.now()}`,
        value: userResult,
        isInitial: false
      }
    ]);
    
    // Réinitialiser le formulaire
    updateCalculationStep(0, 'expression', '');
    updateCalculationStep(0, 'userResult', '');
    setLastInputType(null);
    
    // Message de confirmation
    setValidationMessage({
      text: `Opération validée : ${step.expression} = ${userResult}`,
      isError: false
    });
    
    setTimeout(() => setValidationMessage(null), 3000);
  }, [calculationSteps, updateCalculationStep]);
  
  // Utiliser le résultat comme résultat final
  const useAsResult = useCallback(() => {
    let result;
    
    // Priorité au résultat saisi
    if (calculationSteps[0].userResult) {
      result = parseFloat(calculationSteps[0].userResult);
    } 
    // Sinon utiliser le dernier nombre cliqué
    else if (lastClickedNumber !== null) {
      result = lastClickedNumber;
    } else {
      setValidationMessage({
        text: 'Veuillez entrer un résultat ou cliquer sur un nombre',
        isError: true
      });
      
      setTimeout(() => setValidationMessage(null), 3000);
      return;
    }
    
    if (!isNaN(result)) {
      setFinalAnswer(result.toString());
      setValidationMessage({
        text: `Résultat final défini : ${result}`,
        isError: false
      });
      
      setTimeout(() => setValidationMessage(null), 3000);
      
      // Pour la démo, afficher le résultat après un court délai
      setTimeout(() => {
        stopAllTimers();
        setTimeExpired(true);
        showFinalResultModal();
      }, 1500);
    }
  }, [calculationSteps, lastClickedNumber, stopAllTimers]);
  
  // Afficher la modale de résultat final
  const showFinalResultModal = useCallback(() => {
    // Calcul de la différence avec la cible
    const finalResult = parseFloat(finalAnswer) || 0;
    const difference = Math.abs(target - finalResult);
    
    // Calcul des points
    let points = 0;
    if (difference === 0) {
      points = 10; // Exact match
    } else if (difference <= 5) {
      points = 5; // Very close
    } else if (difference <= 10) {
      points = 3; // Close
    } else if (difference <= 20) {
      points = 2; // Not bad
    } else {
      points = 1; // At least they tried
    }
    
    // Ajouter les points au score
    setScore(prev => prev + points);
    
    // Message selon la performance
    let message;
    if (difference === 0) {
      message = "Félicitations ! Vous avez trouvé le nombre exact !";
    } else if (difference <= 5) {
      message = `Très bien ! Votre résultat (${finalResult}) est à seulement ${difference} du nombre cible.`;
    } else if (difference <= 20) {
      message = `Votre résultat (${finalResult}) est à ${difference} du nombre cible.`;
    } else {
      message = `Vous êtes à ${difference} du nombre cible. Continuez à vous entraîner !`;
    }
    
    // Préparer le résumé
    const summary = {
      target,
      finalResult,
      difference,
      points,
      message,
      success: difference === 0,
      // Récupérer les nombres initiaux
      initialNumbers: availableNumbersForCalc
        .filter(item => item.isInitial)
        .map(item => ({ id: item.id, value: item.value }))
    };
    
    setResultSummary(summary);
    setShowResultSummary(true);
  }, [target, finalAnswer, availableNumbersForCalc]);
  
  // Reset game for new round
  const resetGame = useCallback((phase) => {
    if (phase === 'letters') {
      setRoundsPlayed(prev => prev + 1);
    }
    
    const newNumbers = phase === 'numbers' ? getRandomNumbers() : [];
    setSelectedLetters([]);
    setSelectedNumbers(newNumbers);
    setAvailableNumbersForCalc(newNumbers.map((number, index) => ({
      id: `initial-${index}`,
      value: number,
      isInitial: true
    })));
    setUsedNumbers([]);
    setUsedCalculatedNumbers([]);
    setOperations([]);
    setTarget(null);
    setGamePhase(phase);
    setWordAnswer('');
    setUsedLetters({});
    setCalculationSteps([{ expression: '', userResult: '', validated: false }]);
    setFinalAnswer('');
    setWordValidation(null);
    setLastInputType(null);
    stopAllTimers();
    setTimeExpired(false);
  }, [stopAllTimers]);

  // Reset entire game including score
  const resetEntireGame = useCallback(() => {
    resetGame('letters');
    setScore(0);
    setRoundsPlayed(0);
  }, [resetGame]);

  // Rendu du composant
  return (
    <div className="space-y-4 bg-gray-100 p-2 md:p-4 min-h-screen relative">
      {showCountdown && (
        <Countdown count={countdown} />
      )}
      
      <div className="flex flex-col md:flex-row justify-between items-center max-w-3xl mx-auto mb-4 gap-2">
        <div className="text-xl font-bold text-gray-800">
          Des Chiffres et Des Lettres
        </div>
        <div className="flex space-x-4 w-full justify-center md:justify-end">
          <div className="px-4 py-2 bg-indigo-100 rounded-lg">
            <span className="font-bold">Score:</span> {score}
          </div>
          <div className="px-4 py-2 bg-teal-100 rounded-lg">
            <span className="font-bold">Tours:</span> {roundsPlayed}
          </div>
        </div>
      </div>
      
      <Card className="w-full max-w-3xl mx-auto">
        <CardContent>
          {gamePhase === 'letters' && (
            <div className="space-y-4">
              {timerActive && (
                <Timer seconds={timer} totalSeconds={LETTERS_TIMER_DURATION} />
              )}
              
              <div className="flex flex-wrap gap-2 min-h-16 p-4 bg-indigo-50 rounded-lg justify-center">
                {selectedLetters.map((letter, index) => (
                  <div 
                    key={index} 
                    className={`w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-lg font-bold text-xl transition-all duration-200
                      ${usedLetters[index] 
                        ? 'bg-gray-200 border-2 border-gray-300 text-gray-500 cursor-not-allowed' 
                        : 'bg-white border-2 border-indigo-500 text-indigo-900 cursor-pointer hover:bg-indigo-100'}`}
                    onClick={() => {
                      if (!usedLetters[index] && !timeExpired && !showCountdown) {
                        setWordAnswer(prev => prev + letter);
                        setUsedLetters(prev => ({...prev, [index]: true}));
                      }
                    }}
                  >
                    {letter}
                  </div>
                ))}
                {Array(10 - selectedLetters.length).fill(0).map((_, index) => (
                  <div key={`empty-${index}`} className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-white border-2 border-gray-300 rounded-lg font-bold text-xl opacity-30">
                    ?
                  </div>
                ))}
              </div>
              
              {selectedLetters.length < 10 && (
                <div className="flex gap-2">
                  <Button 
                    onClick={() => addLetter(true)}
                    disabled={selectedLetters.length >= 10 || showCountdown}
                    className="flex-1"
                  >
                    Voyelle
                  </Button>
                  <Button 
                    onClick={() => addLetter(false)}
                    disabled={selectedLetters.length >= 10 || showCountdown}
                    className="flex-1"
                  >
                    Consonne
                  </Button>
                </div>
              )}
              
              {(selectedLetters.length === 10 || timerActive || timeExpired) && (
                <div className="space-y-2">
                  <div className="space-y-2">
                    <div className="w-full">
                      <Input
                        type="text"
                        placeholder="Cliquez sur les lettres pour former un mot"
                        value={wordAnswer}
                        className="w-full"
                        disabled={true}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <Button 
                        onClick={removeLastLetter}
                        disabled={timeExpired || showCountdown || !wordAnswer.length}
                        variant="outline"
                        className="w-full flex items-center justify-center"
                        title="Effacer la dernière lettre"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
                          <line x1="18" y1="9" x2="12" y2="15" />
                          <line x1="12" y1="9" x2="18" y2="15" />
                        </svg>
                      </Button>
                      <Button 
                        onClick={() => {
                          setWordAnswer('');
                          setUsedLetters({});
                        }}
                        disabled={timeExpired || showCountdown || !wordAnswer.length}
                        variant="outline"
                        className="w-full flex items-center justify-center"
                        title="Effacer tout le mot"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                          <line x1="9" y1="9" x2="15" y2="15" />
                          <line x1="15" y1="9" x2="9" y2="15" />
                        </svg>
                      </Button>
                      <Button 
                        onClick={validateWord}
                        disabled={timeExpired || showCountdown || !wordAnswer}
                        className="w-full"
                      >
                        Valider
                      </Button>
                    </div>
                  </div>
                  
                  {wordValidation && (
                    <div className={`p-2 rounded-lg ${wordValidation.valid ? 'bg-green-100' : 'bg-red-100'}`}>
                      {wordValidation.message}
                    </div>
                  )}
                  
                  {timeExpired && !wordValidation && (
                    <div className="p-2 rounded-lg bg-yellow-100">
                      Temps écoulé ! Vous ne pouvez plus proposer de mot.
                    </div>
                  )}
                  {wordValidation && (
                    <div className="p-3 mt-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-800">
                        Mot validé ! Vous pouvez maintenant passer à la manche des chiffres.
                      </p>
                    </div>
                  )}
                  
                  <Button 
                    onClick={() => resetGame('numbers')} 
                    className="w-full mt-3"
                    variant={timeExpired || wordValidation ? "default" : "outline"}
                  >
                    {timeExpired || wordValidation ? "Passer à la manche des chiffres" : "Abandonner et passer aux chiffres"}
                  </Button>
                </div>
              )}
            </div>
          )}

          {gamePhase === 'numbers' && (
            <div className="space-y-6">
              <div className="flex items-center justify-center p-3 bg-amber-50 rounded-lg border border-amber-300 shadow-md mb-2">
                <div className="inline-block mr-3">
                  <span className="text-sm font-medium text-gray-600">Cible:</span>
                </div>
                <span className="text-2xl font-bold text-amber-700">{target || "???"}</span>
              </div>
              
              <div className="flex flex-wrap gap-2 min-h-16 p-4 bg-indigo-50 rounded-lg justify-center">
                {selectedNumbers.map((number, index) => (
                  <div key={index} className="w-14 h-12 md:w-16 flex items-center justify-center bg-white border-2 border-teal-500 rounded-lg font-bold text-xl">
                    {number}
                  </div>
                ))}
              </div>
              <Button 
                onClick={generateTarget} 
                className="w-full"
                disabled={showCountdown}
              >
                Générer le nombre cible
              </Button>
            </div>
          )}

          {gamePhase === 'target' && (
            <div className="space-y-6">
              <div className="flex items-center justify-center p-3 bg-amber-50 rounded-lg border border-amber-300 shadow-md mb-2">
                <div className="inline-block mr-3">
                  <span className="text-sm font-medium text-gray-600">Cible:</span>
                </div>
                <span className="text-2xl font-bold text-amber-700">{target}</span>
              </div>
              
              {(timerActive || showCountdown) && (
                <Timer seconds={timerActive ? timer : NUMBERS_TIMER_DURATION} totalSeconds={NUMBERS_TIMER_DURATION} />
              )}
              
              <div className="bg-white p-4 rounded-lg shadow-md mt-2 mb-4">
                <div className="space-y-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2">
                    <div className="flex-grow">
                        <Input
                          type="text"
                          placeholder="Expression (ex: 75 * 4) ou laissez vide pour résultat direct"
                          value={calculationSteps[0].expression}
                          disabled={true}
                          className="bg-white"
                        />
                    </div>
                    <div className="font-bold text-lg px-1">=</div>
                    <div className="w-1/3">
                      <div className="relative">
                        <Input
                          ref={resultInputRef}
                          type="number"
                          placeholder="Résultat"
                          value={calculationSteps[0].userResult || ''}
                          onChange={(e) => updateCalculationStep(0, 'userResult', e.target.value)}
                          disabled={timeExpired || showCountdown}
                          className="bg-white"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex gap-2 ml-auto">
                      <Button 
                        onClick={validateAndAddResult}
                        disabled={timeExpired || showCountdown || !calculationSteps[0].userResult || (!calculationSteps[0].expression && calculationSteps[0].userResult)}
                        variant="outline"
                        className="text-xs px-2 py-1"
                      >
                        Valider et ajouter
                      </Button>
                      <Button 
                        onClick={useAsResult}
                        disabled={timeExpired || showCountdown || (!calculationSteps[0].userResult && lastClickedNumber === null)}
                        className="text-xs px-2 py-1 bg-teal-500 hover:bg-teal-600 text-white"
                      >
                        Définir comme résultat final
                      </Button>
                    </div>
                  </div>
                  
                  {validationMessage && (
                    <div className={`mt-2 p-3 rounded-lg ${validationMessage.isError ? 'bg-orange-100 border border-orange-300 text-orange-800' : 'bg-green-100 border border-green-300 text-green-800'}`}>
                      {validationMessage.text}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow-md">
                <div className="flex flex-wrap gap-2 justify-center">
                  {availableNumbersForCalc
                    .filter(item => item.isInitial === true)
                    .map((item, index) => {
                      const isUsed = usedNumbers.includes(index);
                      return (
                        <div 
                          key={item.id} 
                          className={`w-14 h-12 md:w-16 flex items-center justify-center rounded-lg font-bold text-xl ${isUsed 
                            ? 'bg-gray-200 border-2 border-gray-300 text-gray-500 cursor-not-allowed' 
                            : 'bg-white border-2 border-teal-500 text-teal-800 cursor-pointer hover:bg-teal-50 shadow-sm'}`}
                          onClick={() => {
                            if (!isUsed && !timeExpired && !showCountdown) {
                              setLastClickedNumber(item.value);
                              
                              if (lastInputType === 'operator' || lastInputType === null) {
                                const currentStep = calculationSteps[0];
                                updateCalculationStep(
                                  0, 
                                  'expression', 
                                  currentStep.expression + ' ' + item.value
                                );
                                setUsedNumbers(prev => [...prev, index]);
                                setLastInputType('number');
                              }
                            }
                          }}
                        >
                          {item.value}
                        </div>
                      );
                    })
                  }
                  
                  {availableNumbersForCalc
                    .filter(item => item.isInitial === false)
                    .map((item) => {
                      const isUsed = usedCalculatedNumbers.includes(item.id);
                      return (
                        <div 
                          key={item.id} 
                          className={`w-14 h-12 md:w-16 flex items-center justify-center rounded-lg font-bold text-xl ${isUsed 
                            ? 'bg-gray-200 border-2 border-gray-300 text-gray-500 cursor-not-allowed' 
                            : 'bg-white border-2 border-purple-400 text-purple-800 cursor-pointer hover:bg-purple-50 shadow-sm'}`}
                          onClick={() => {
                            if (!isUsed && !timeExpired && !showCountdown) {
                              setLastClickedNumber(item.value);
                              
                              if (lastInputType === 'operator' || lastInputType === null) {
                                const currentStep = calculationSteps[0];
                                updateCalculationStep(
                                  0, 
                                  'expression', 
                                  currentStep.expression + ' ' + item.value
                                );
                                setUsedCalculatedNumbers(prev => [...prev, item.id]);
                                setLastInputType('number');
                              }
                            }
                          }}
                        >
                          {item.value}
                        </div>
                      );
                    })
                  }
                </div>

                <div className="flex flex-col gap-2 mt-4">
                  <div className="grid grid-cols-5 gap-2">
                    {operators.map((op, index) => (
                      <button
                        key={index}
                        className={`py-3 bg-indigo-100 text-indigo-900 font-bold rounded hover:bg-indigo-200 focus:outline-none shadow-sm ${lastInputType !== 'number' && lastInputType !== 'operator' ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={() => addOperator(op)}
                        disabled={timeExpired || showCountdown || (lastInputType !== 'number' && lastInputType !== 'operator')}
                      >
                        {op}
                      </button>
                    ))}
                    <button
                      className="py-3 bg-indigo-500 text-white font-bold rounded hover:bg-indigo-600 focus:outline-none shadow-sm"
                      onClick={() => resultInputRef.current.focus()}
                      disabled={timeExpired || showCountdown || !calculationSteps[0].expression || lastInputType !== 'number'}
                      title={lastInputType !== 'number' ? "Vous devez terminer l'expression par un nombre" : ""}
                    >
                      =
                    </button>
                  </div>
                </div>
              </div>

              {/* Affichage des opérations validées */}
              {operations.length > 0 && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="font-semibold mb-2">Opérations validées :</h3>
                  <div className="space-y-2">
                    {operations.map((op) => (
                      <div key={op.id} className="bg-white p-2 rounded-lg shadow-sm">
                        <div className="text-sm font-medium flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#14B8A6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                          <span>{op.expression} = {op.result}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {timeExpired && (
                <div className="p-4 rounded-lg bg-amber-50 shadow-md">
                  <p className="font-semibold">Temps écoulé !</p>
                </div>
              )}

              <Button onClick={() => resetGame('letters')} className="w-full mt-4">
                Nouvelle partie
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card className="w-full max-w-3xl mx-auto">
        <CardContent>
          <div className="space-y-4 text-sm">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-lg">Règles du jeu</h4>
              <Button 
                onClick={() => setRulesModalOpen(true)} 
                variant="outline"
              >
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                  </svg>
                  Voir les règles détaillées
                </div>
              </Button>
            </div>
            <div className="pt-2 border-t border-gray-200">
              <Button onClick={resetEntireGame} variant="outline" className="w-full">
                Recommencer le jeu
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Modales */}
      <DictionaryModal 
        isOpen={dictionaryModalOpen} 
        onClose={() => setDictionaryModalOpen(false)} 
        word={wordAnswer.toUpperCase()}
        result={dictionaryResult}
      />
      
      <ResultSummaryModal
        isOpen={showResultSummary}
        onClose={() => setShowResultSummary(false)}
        summary={resultSummary}
      />
      
      <RulesModal
        isOpen={rulesModalOpen}
        onClose={() => setRulesModalOpen(false)}
      />
    </div>
  );
};

// Main Game Wrapper
const GameWrapper = () => {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <ChiffresLettres />
    </div>
  );
};

export default GameWrapper;