import React, { useState, useEffect, useCallback, useRef } from "react";

// ===== Constantes =====
const letterFrequencies = {
  A: 8.15,
  B: 0.97,
  C: 3.15,
  D: 3.73,
  E: 17.39,
  F: 1.12,
  G: 0.97,
  H: 0.85,
  I: 7.31,
  J: 0.45,
  K: 0.02,
  L: 5.69,
  M: 2.87,
  N: 7.12,
  O: 5.28,
  P: 2.8,
  Q: 1.21,
  R: 6.64,
  S: 8.14,
  T: 7.22,
  U: 6.38,
  V: 1.64,
  W: 0.03,
  X: 0.41,
  Y: 0.28,
  Z: 0.15,
};

const vowels = ["A", "E", "I", "O", "U", "Y"];
const consonants = [
  "B",
  "C",
  "D",
  "F",
  "G",
  "H",
  "J",
  "K",
  "L",
  "M",
  "N",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "V",
  "W",
  "X",
  "Z",
];
const availableNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 25, 50, 75, 100];
const operators = ["+", "-", "*", "/"];
const LETTERS_TIMER_DURATION = 45;
const NUMBERS_TIMER_DURATION = 60;
const COUNTDOWN_DURATION = 2;

// ===== Utility Functions =====
const evaluateExpression = (expression) => {
  try {
    if (!expression || expression.trim() === "") return null;

    const sanitizedExpression = expression
      .replace(/[^0-9+\-*/().\s]/g, "")
      .replace(/\s+/g, "");

    if (sanitizedExpression === "") return null;

    try {
      const result = Function(
        `'use strict'; return (${sanitizedExpression})`
      )();
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
          backgroundColor:
            seconds <= 10 ? "#EF4444" : seconds <= 20 ? "#F59E0B" : "#10B981",
        }}
      ></div>
      <div className="absolute inset-0 flex items-center justify-center font-bold text-base md:text-lg">
        {seconds} secondes
      </div>
    </div>
  );
};

// Button Component
const Button = ({ children, onClick, disabled, className = "", variant }) => {
  const baseClasses =
    "py-2 px-3 md:px-4 rounded font-medium focus:outline-none focus:ring-2 focus:ring-opacity-50 text-sm md:text-base";
  const variantClasses =
    variant === "outline"
      ? "border border-indigo-300 text-indigo-700 bg-white hover:bg-indigo-50 focus:ring-indigo-500"
      : "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500";

  return (
    <button
      className={`${baseClasses} ${variantClasses} ${className} ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      }`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

// Card Components
const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-lg shadow-md overflow-hidden ${className}`}>
    {children}
  </div>
);

const CardContent = ({ children }) => <div className="p-6">{children}</div>;

// Input Component
const Input = React.forwardRef(
  (
    {
      type = "text",
      placeholder,
      value,
      onChange,
      onKeyDown,
      onEnter,
      className = "",
      disabled,
    },
    ref
  ) => {
    const handleKeyDown = (e) => {
      if (onKeyDown) onKeyDown(e);
      if (e.key === "Enter" && onEnter) {
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
        className={`w-full px-2 md:px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base ${className} ${
          disabled ? "bg-gray-100" : ""
        }`}
      />
    );
  }
);

Input.displayName = "Input";

// ===== Main Game Component =====
const ChiffresLettres = () => {
  // État du jeu
  const [gamePhase, setGamePhase] = useState("letters");
  const [score, setScore] = useState(0);
  const [roundsPlayed, setRoundsPlayed] = useState(0);

  // État des lettres
  const [selectedLetters, setSelectedLetters] = useState([]);
  const [usedLetters, setUsedLetters] = useState({});
  const [wordAnswer, setWordAnswer] = useState("");
  const [wordValidation, setWordValidation] = useState(null);

  // État des nombres
  const [selectedNumbers, setSelectedNumbers] = useState([]);
  const [availableNumbersForCalc, setAvailableNumbersForCalc] = useState([]);
  const [usedNumbers, setUsedNumbers] = useState([]);
  const [usedCalculatedNumbers, setUsedCalculatedNumbers] = useState([]);
  const [target, setTarget] = useState(null);

  // État des calculs
  const [calculationSteps, setCalculationSteps] = useState([
    { expression: "", userResult: "", validated: false },
  ]);
  const [operations, setOperations] = useState([]);
  const [lastInputType, setLastInputType] = useState(null);
  const [lastClickedNumber, setLastClickedNumber] = useState(null);

  // État du timer
  const [timer, setTimer] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [timeExpired, setTimeExpired] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [showCountdown, setShowCountdown] = useState(false);

  // État divers
  const [validationMessage, setValidationMessage] = useState(null);

  // Refs
  const resultInputRef = useRef(null);
  const timerRef = useRef(null);
  const countdownRef = useRef(null);

  // Timer functions
  const startMainTimer = useCallback(() => {
    const duration =
      gamePhase === "target" ? NUMBERS_TIMER_DURATION : LETTERS_TIMER_DURATION;
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
        setCountdown((prev) => prev - 1);
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
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timerActive && timer === 0) {
      setTimerActive(false);
      setTimeExpired(true);
    }

    return () => {
      clearTimeout(timerRef.current);
    };
  }, [timerActive, timer]);

  // Letter selection logic
  const getRandomLetter = useCallback((isVowel) => {
    const letterPool = isVowel ? vowels : consonants;

    // Sélection pondérée par fréquence
    let totalWeight = 0;
    letterPool.forEach((letter) => (totalWeight += letterFrequencies[letter]));

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

  const addLetter = useCallback(
    (isVowel) => {
      if (selectedLetters.length < 10) {
        const newLetter = getRandomLetter(isVowel);
        const newSelectedLetters = [...selectedLetters, newLetter];
        setSelectedLetters(newSelectedLetters);

        if (newSelectedLetters.length === 10) {
          startMainTimer();
        }
      }
    },
    [selectedLetters, getRandomLetter, startMainTimer]
  );

  // Generate target number
  const generateTarget = useCallback(() => {
    setTarget(Math.floor(Math.random() * 900) + 100);
    setGamePhase("target");

    // Initialiser les nombres disponibles
    const initialNumbers = selectedNumbers.map((number, index) => ({
      id: `initial-${index}`,
      value: number,
      isInitial: true,
    }));

    setAvailableNumbersForCalc(initialNumbers);
    setUsedNumbers([]);
    setUsedCalculatedNumbers([]);
    setOperations([]);
    startCountdown();
  }, [selectedNumbers, startCountdown]);

  // Word validation
  const validateWord = useCallback(() => {
    const input = wordAnswer.toUpperCase();
    if (!input) return;

    setWordValidation({
      valid: true,
      message: "Mot formé avec les lettres disponibles.",
    });

    if (!timeExpired) {
      const wordLength = input.length;
      const points = wordLength;
      setScore((prev) => prev + points);
    }

    // Pour démonstration
    setTimeout(() => {
      stopAllTimers();
      setTimeExpired(true);
    }, 500);
  }, [wordAnswer, timeExpired, stopAllTimers]);

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
        setUsedLetters((prev) => {
          const newUsedLetters = { ...prev };
          delete newUsedLetters[lastUsedIndex];
          return newUsedLetters;
        });
      }

      // Supprimer la dernière lettre du mot
      setWordAnswer((prev) => prev.slice(0, -1));
    }
  }, [wordAnswer, selectedLetters, usedLetters]);

  // Calculation steps handling
  const updateCalculationStep = useCallback((index, field, value) => {
    setCalculationSteps((prev) => {
      const newSteps = [...prev];
      newSteps[index] = {
        ...newSteps[index],
        [field]: value,
        validated: false,
      };
      return newSteps;
    });
  }, []);

  // Ajout des opérateurs
  const addOperator = useCallback(
    (operator) => {
      if (!timeExpired && !showCountdown) {
        const currentStep = calculationSteps[0];

        // Vérifier si l'expression est vide
        if (!currentStep.expression.trim()) {
          setValidationMessage({
            text: "Vous devez d'abord sélectionner un nombre!",
            isError: true,
          });

          setTimeout(() => setValidationMessage(null), 3000);
          return;
        }

        // Si le dernier caractère tapé est déjà un opérateur, le remplacer
        if (lastInputType === "operator") {
          const trimmedExpression = currentStep.expression.trim();
          const lastSpaceIndex = trimmedExpression.lastIndexOf(" ");
          if (lastSpaceIndex !== -1) {
            const newExpression =
              trimmedExpression.substring(0, lastSpaceIndex + 1) +
              operator +
              " ";
            updateCalculationStep(0, "expression", newExpression);
          }
        } else {
          // Ajouter l'opérateur normalement
          updateCalculationStep(
            0,
            "expression",
            currentStep.expression + " " + operator + " "
          );
          setLastInputType("operator");
        }
      }
    },
    [
      timeExpired,
      showCountdown,
      calculationSteps,
      lastInputType,
      updateCalculationStep,
    ]
  );

  // Reset game for new round
  const resetGame = useCallback(
    (phase) => {
      if (phase === "letters") {
        setRoundsPlayed((prev) => prev + 1);
      }

      const newNumbers = phase === "numbers" ? getRandomNumbers() : [];
      setSelectedLetters([]);
      setSelectedNumbers(newNumbers);
      setAvailableNumbersForCalc(
        newNumbers.map((number, index) => ({
          id: `initial-${index}`,
          value: number,
          isInitial: true,
        }))
      );
      setUsedNumbers([]);
      setUsedCalculatedNumbers([]);
      setOperations([]);
      setTarget(null);
      setGamePhase(phase);
      setWordAnswer("");
      setUsedLetters({});
      setCalculationSteps([
        { expression: "", userResult: "", validated: false },
      ]);
      setWordValidation(null);
      setLastInputType(null);
      stopAllTimers();
      setTimeExpired(false);
    },
    [stopAllTimers]
  );

  // Reset entire game including score
  const resetEntireGame = useCallback(() => {
    resetGame("letters");
    setScore(0);
    setRoundsPlayed(0);
  }, [resetGame]);

  // Rendu du composant
  return (
    <div className="space-y-4 bg-gray-100 p-2 md:p-4 min-h-screen relative">
      {showCountdown && <Countdown count={countdown} />}

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
          {gamePhase === "letters" && (
            <div className="space-y-4">
              {timerActive && (
                <Timer seconds={timer} totalSeconds={LETTERS_TIMER_DURATION} />
              )}

              <div className="flex flex-wrap gap-2 min-h-16 p-4 bg-indigo-50 rounded-lg justify-center">
                {selectedLetters.map((letter, index) => (
                  <div
                    key={index}
                    className={`w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-lg font-bold text-xl transition-all duration-200
                      ${
                        usedLetters[index]
                          ? "bg-gray-200 border-2 border-gray-300 text-gray-500 cursor-not-allowed"
                          : "bg-white border-2 border-indigo-500 text-indigo-900 cursor-pointer hover:bg-indigo-100"
                      }`}
                    onClick={() => {
                      if (
                        !usedLetters[index] &&
                        !timeExpired &&
                        !showCountdown
                      ) {
                        setWordAnswer((prev) => prev + letter);
                        setUsedLetters((prev) => ({ ...prev, [index]: true }));
                      }
                    }}
                  >
                    {letter}
                  </div>
                ))}
                {Array(10 - selectedLetters.length)
                  .fill(0)
                  .map((_, index) => (
                    <div
                      key={`empty-${index}`}
                      className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-white border-2 border-gray-300 rounded-lg font-bold text-xl opacity-30"
                    >
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

              {(selectedLetters.length === 10 ||
                timerActive ||
                timeExpired) && (
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
                        disabled={
                          timeExpired || showCountdown || !wordAnswer.length
                        }
                        variant="outline"
                        className="w-full flex items-center justify-center"
                        title="Effacer la dernière lettre"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
                          <line x1="18" y1="9" x2="12" y2="15" />
                          <line x1="12" y1="9" x2="18" y2="15" />
                        </svg>
                      </Button>
                      <Button
                        onClick={() => {
                          setWordAnswer("");
                          setUsedLetters({});
                        }}
                        disabled={
                          timeExpired || showCountdown || !wordAnswer.length
                        }
                        variant="outline"
                        className="w-full flex items-center justify-center"
                        title="Effacer tout le mot"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <rect
                            x="3"
                            y="3"
                            width="18"
                            height="18"
                            rx="2"
                            ry="2"
                          />
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
                    <div
                      className={`p-2 rounded-lg ${
                        wordValidation.valid ? "bg-green-100" : "bg-red-100"
                      }`}
                    >
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
                        Mot validé ! Vous pouvez maintenant passer à la manche
                        des chiffres.
                      </p>
                    </div>
                  )}

                  <Button
                    onClick={() => resetGame("numbers")}
                    className="w-full mt-3"
                    variant={
                      timeExpired || wordValidation ? "default" : "outline"
                    }
                  >
                    {timeExpired || wordValidation
                      ? "Passer à la manche des chiffres"
                      : "Abandonner et passer aux chiffres"}
                  </Button>
                </div>
              )}
            </div>
          )}

          {gamePhase === "numbers" && (
            <div className="space-y-6">
              <div className="flex items-center justify-center p-3 bg-amber-50 rounded-lg border border-amber-300 shadow-md mb-2">
                <div className="inline-block mr-3">
                  <span className="text-sm font-medium text-gray-600">
                    Cible:
                  </span>
                </div>
                <span className="text-2xl font-bold text-amber-700">
                  {target || "???"}
                </span>
              </div>

              <div className="flex flex-wrap gap-2 min-h-16 p-4 bg-indigo-50 rounded-lg justify-center">
                {selectedNumbers.map((number, index) => (
                  <div
                    key={index}
                    className="w-14 h-12 md:w-16 flex items-center justify-center bg-white border-2 border-teal-500 rounded-lg font-bold text-xl"
                  >
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

          {gamePhase === "target" && (
            <div className="space-y-6">
              <div className="flex items-center justify-center p-3 bg-amber-50 rounded-lg border border-amber-300 shadow-md mb-2">
                <div className="inline-block mr-3">
                  <span className="text-sm font-medium text-gray-600">
                    Cible:
                  </span>
                </div>
                <span className="text-2xl font-bold text-amber-700">
                  {target}
                </span>
              </div>

              {(timerActive || showCountdown) && (
                <Timer
                  seconds={timerActive ? timer : NUMBERS_TIMER_DURATION}
                  totalSeconds={NUMBERS_TIMER_DURATION}
                />
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
                          value={calculationSteps[0].userResult || ""}
                          onChange={(e) =>
                            updateCalculationStep(
                              0,
                              "userResult",
                              e.target.value
                            )
                          }
                          disabled={timeExpired || showCountdown}
                          className="bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex gap-2 ml-auto">
                      <Button
                        onClick={() => {
                          setValidationMessage({
                            text: "Opération validée et ajoutée",
                            isError: false,
                          });
                          setTimeout(() => setValidationMessage(null), 3000);
                        }}
                        disabled={
                          timeExpired ||
                          showCountdown ||
                          !calculationSteps[0].userResult ||
                          (!calculationSteps[0].expression &&
                            calculationSteps[0].userResult)
                        }
                        variant="outline"
                        className="text-xs px-2 py-1"
                      >
                        Valider et ajouter
                      </Button>
                      <Button
                        onClick={() => {
                          setValidationMessage({
                            text: "Résultat final défini",
                            isError: false,
                          });
                          setTimeout(() => setValidationMessage(null), 3000);

                          // Pour démo, on termine après 2 secondes
                          setTimeout(() => {
                            stopAllTimers();
                            setTimeExpired(true);
                          }, 2000);
                        }}
                        disabled={
                          timeExpired ||
                          showCountdown ||
                          (!calculationSteps[0].userResult &&
                            lastClickedNumber === null)
                        }
                        className="text-xs px-2 py-1 bg-teal-500 hover:bg-teal-600 text-white"
                      >
                        Définir comme résultat final
                      </Button>
                    </div>
                  </div>

                  {validationMessage && (
                    <div
                      className={`mt-2 p-3 rounded-lg ${
                        validationMessage.isError
                          ? "bg-orange-100 border border-orange-300 text-orange-800"
                          : "bg-green-100 border border-green-300 text-green-800"
                      }`}
                    >
                      {validationMessage.text}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-md">
                <div className="flex flex-wrap gap-2 justify-center">
                  {availableNumbersForCalc
                    .filter(
                      (item) =>
                        typeof item === "object" && item.isInitial === true
                    )
                    .map((item, index) => {
                      const isUsed = usedNumbers.includes(index);
                      return (
                        <div
                          key={item.id}
                          className={`w-14 h-12 md:w-16 flex items-center justify-center rounded-lg font-bold text-xl ${
                            isUsed
                              ? "bg-gray-200 border-2 border-gray-300 text-gray-500 cursor-not-allowed"
                              : "bg-white border-2 border-teal-500 text-teal-800 cursor-pointer hover:bg-teal-50 shadow-sm"
                          }`}
                          onClick={() => {
                            if (!isUsed && !timeExpired && !showCountdown) {
                              setLastClickedNumber(item.value);

                              if (
                                lastInputType === "operator" ||
                                lastInputType === null
                              ) {
                                const currentStep = calculationSteps[0];
                                updateCalculationStep(
                                  0,
                                  "expression",
                                  currentStep.expression + " " + item.value
                                );
                                setUsedNumbers((prev) => [...prev, index]);
                                setLastInputType("number");
                              }
                            }
                          }}
                        >
                          {item.value}
                        </div>
                      );
                    })}
                </div>

                <div className="flex flex-col gap-2 mt-4">
                  <div className="grid grid-cols-5 gap-2">
                    {operators.map((op, index) => (
                      <button
                        key={index}
                        className={`py-3 bg-indigo-100 text-indigo-900 font-bold rounded hover:bg-indigo-200 focus:outline-none shadow-sm ${
                          lastInputType !== "number" &&
                          lastInputType !== "operator"
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                        onClick={() => addOperator(op)}
                        disabled={
                          timeExpired ||
                          showCountdown ||
                          (lastInputType !== "number" &&
                            lastInputType !== "operator")
                        }
                      >
                        {op}
                      </button>
                    ))}
                    <button
                      className="py-3 bg-indigo-500 text-white font-bold rounded hover:bg-indigo-600 focus:outline-none shadow-sm"
                      onClick={() => resultInputRef.current.focus()}
                      disabled={
                        timeExpired ||
                        showCountdown ||
                        !calculationSteps[0].expression ||
                        lastInputType !== "number"
                      }
                      title={
                        lastInputType !== "number"
                          ? "Vous devez terminer l'expression par un nombre"
                          : ""
                      }
                    >
                      =
                    </button>
                  </div>
                </div>
              </div>

              {timeExpired && (
                <div className="p-4 rounded-lg bg-amber-50 shadow-md">
                  <p className="font-semibold">Temps écoulé !</p>
                  <div className="mt-3 p-3 rounded-lg bg-green-100">
                    <p className="font-medium">
                      Résultat trouvé: vous êtes à 5 du nombre cible.
                    </p>
                  </div>
                </div>
              )}

              <Button
                onClick={() => resetGame("letters")}
                className="w-full mt-4"
              >
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
                onClick={() => {
                  setValidationMessage({
                    text: "Règles affichées (version démo simplifiée)",
                    isError: false,
                  });
                  setTimeout(() => setValidationMessage(null), 3000);
                }}
                variant="outline"
              >
                <div className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mr-2"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                  </svg>
                  Voir les règles détaillées
                </div>
              </Button>
            </div>
            <div className="pt-2 border-t border-gray-200">
              <Button
                onClick={resetEntireGame}
                variant="outline"
                className="w-full"
              >
                Recommencer le jeu
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Function Component pour le rendu
function App() {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <ChiffresLettres />
    </div>
  );
}

export default App;
