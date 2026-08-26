import { motion, AnimatePresence } from "framer-motion";
import { Box, Text, Button, VStack, HStack } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { DiceFive, ChartBar, HouseLine, ArrowClockwise } from "@phosphor-icons/react";
import { t } from "../theme";

// Score out of 1000 based on guess count + time bonus
function calcScore(guessCount, maxGuesses, won, durationSeconds) {
  if (!won) return 0;
  const perfect = 900;
  const deductPerGuess = Math.floor(perfect / maxGuesses);
  const base = Math.max(50, perfect - (guessCount - 1) * deductPerGuess);

  let timeBonus = 0;
  if (durationSeconds != null) {
    if (durationSeconds < 60)        timeBonus = 300;
    else if (durationSeconds < 300)  timeBonus = 200;
    else if (durationSeconds < 600)  timeBonus = 75;
    else if (durationSeconds < 1800) timeBonus = 25;
  }

  return Math.min(1000, base + timeBonus);
}

function getScoreLabel(score) {
  if (score >= 900) return { label: "Genius 🧠",             color: t.accent };
  if (score >= 750) return { label: "Impressive 🔥",         color: t.accentAlt };
  if (score >= 550) return { label: "Solid 💪",              color: t.accent };
  if (score >= 350) return { label: "Getting there 👀",      color: t.muted };
  if (score >= 100) return { label: "Lucky escape 😅",       color: t.muted };
  return             { label: "Better luck tomorrow 😬",     color: t.present };
}

function TileRow({ guess, result, delay = 0 }) {
  return (
    <HStack gap={1} justify="center">
      {guess.split("").map((letter, i) => {
        const status = result?.[i]?.status || "absent";
        const bg = status === "correct" ? t.correct
                 : status === "present" ? t.present
                 : t.absent;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: delay + i * 0.06, duration: 0.25, ease: "easeOut" }}
          >
            <Box
              w="16px" h="16px"
              bg={bg}
              borderRadius="4px"
              display="flex" alignItems="center" justifyContent="center"
            >
              <Text color={t.white} fontWeight="700" fontFamily={t.font} fontSize="10px" letterSpacing="0.03em">
                {letter}
              </Text>
            </Box>
          </motion.div>
        );
      })}
    </HStack>
  );
}

function timeBonusLabel(durationSeconds) {
  if (durationSeconds == null) return null;
  
  if (durationSeconds < 60)        return "+300 ⚡ under 1 min";
  if (durationSeconds < 300)       return "+200 🔥 under 5 min";
  if (durationSeconds < 600)       return "+75 💨 under 10 min";
  if (durationSeconds < 1800)      return "+25 ⏱️ under 30 min";
  return null;
}

const MEDAL_CONFIG = {
  gold:   { emoji: "🥇", label: "New #1!",         color: "#f5c518", bg: "#fffbea", border: "#f5c518" },
  silver: { emoji: "🥈", label: "New #2!",         color: "#8a9bb0", bg: "#f4f7fa", border: "#8a9bb0" },
  bronze: { emoji: "🥉", label: "New #3!",         color: "#cd7f32", bg: "#fdf6ee", border: "#cd7f32" },
};

export default function ResultScreen({ won, answer, guesses, maxGuesses, wordLength, employee, durationSeconds, score: serverScore, onPlayAgain, onShowStats, onPractice, instant = false, isDaily = false, medalInfo = null }) {
  const navigate = useNavigate();
  const accentColor = won ? t.accent : t.present;
  // Use server-computed score if available (authoritative), fall back to client calc
  const score = serverScore != null ? serverScore : calcScore(guesses.length, maxGuesses, won, durationSeconds);
  const { label: scoreLabelText, color: scoreColor } = getScoreLabel(score);

  const employees = Array.isArray(employee) ? employee : employee ? [employee] : [];
  const emp = employees[0];

  return (
    <AnimatePresence>
      <motion.div
        key="result-screen"
        initial={instant ? false : { x: "100%", opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: "100%", opacity: 0 }}
        transition={instant ? { duration: 0 } : { type: "spring", stiffness: 280, damping: 30 }}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 200,
          background: t.bg,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          overflowY: "auto",
          fontFamily: t.font,
        }}
      >
        {/* Header */}
        <Box
          w="100%" maxW="520px"
          borderBottom="1px solid" borderColor={t.border}
          bg={t.surface} py={3} textAlign="center"
        >
          <Text fontSize="lg" letterSpacing="0.1em" color={t.text} fontWeight="700" fontFamily={t.font} cursor="pointer" onClick={() => navigate("/")}>
            PERMITDLE
          </Text>
        </Box>

        <VStack gap={6} w="100%" maxW="420px" px={4} py={8} align="center">

          {/* Win/Lose headline */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            style={{ textAlign: "center" }}
          >
            <Text fontSize="2xl" fontWeight="bold" color={accentColor}>
              {won ? "You got it! 🎉" : "Not this time 😬"}
            </Text>
            {!won && (
              <Text fontSize="sm" color={t.muted} mt={1}>
                The answer was <Text as="span" color={t.text} fontWeight="700">{answer}</Text>
              </Text>
            )}
          </motion.div>

          {/* Tiles + Employee card side by side */}
          <HStack gap={4} align="center" w="100%">
            {/* Guess grid */}
            <VStack gap={1} flexShrink={0}>
              {Array.from({ length: maxGuesses }, (_, rowIdx) => {
                const g = guesses[rowIdx];
                return (
                  <motion.div
                    key={rowIdx}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 + rowIdx * 0.05 }}
                  >
                    {g ? (
                      <TileRow guess={g.guess} result={g.result} delay={0.35 + rowIdx * 0.06} />
                    ) : (
                      <HStack gap={1} justify="center">
                        {Array.from({ length: wordLength }, (_, i) => (
                          <Box
                            key={i}
                            w="16px" h="16px"
                            bg="transparent"
                            border={`2px solid ${t.border}`}
                            borderRadius="4px"
                          />
                        ))}
                      </HStack>
                    )}
                  </motion.div>
                );
              })}
            </VStack>

            {/* Employee card */}
            {emp && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: won ? 1.2 : 1.0, duration: 0.4 }}
                style={{ flex: 1, minWidth: 0 }}
              >
                <Box
                  w="100%" bg={t.surface}
                  border="1px solid" borderColor={t.border}
                  borderRadius="xl" overflow="hidden"
                >
                  <Box
                    h="80px" bg={accentColor}
                    display="flex" alignItems="flex-end" justifyContent="center"
                    position="relative"
                  >
                    <Box
                      position="absolute" bottom="-36px"
                      w="72px" h="72px" borderRadius="full"
                      overflow="hidden"
                      border={`3px solid ${t.surface}`}
                    >
                      {emp.avatarUrl ? (
                        <img
                          src={`/api/avatar?url=${encodeURIComponent(emp.avatarUrl)}`}
                          alt={emp.fullName}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        <Box w="100%" h="100%" bg={accentColor}
                          display="flex" alignItems="center" justifyContent="center">
                          <Text fontSize="xl" fontWeight="bold" color={t.white}>
                            {emp.fullName?.[0]}
                          </Text>
                        </Box>
                      )}
                    </Box>
                  </Box>
                  <VStack gap={1} pt="44px" pb={3} px={2} textAlign="center">
                    <Text fontSize="sm" fontWeight="700" fontFamily={t.font} color={t.text} noOfLines={1}>{emp.fullName}</Text>
                    {(emp.slackTitle || emp.title) && (
                      <Text fontSize="10px" color={t.muted} noOfLines={2}>{emp.slackTitle || emp.title}</Text>
                    )}
                    {emp.department && (
                      <Box
                        bg={accentColor + "22"} border="1px solid" borderColor={accentColor + "66"}
                        borderRadius="full" px={2} py={0.5} mt={0.5}
                      >
                        <Text fontSize="9px" color={accentColor} fontWeight="semibold">
                          {emp.department}
                        </Text>
                      </Box>
                    )}
                  </VStack>
                </Box>
              </motion.div>
            )}
          </HStack>

          {/* Score card */}
          {won && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.8, type: "spring", stiffness: 200 }}
              style={{ textAlign: "center", width: "100%" }}
            >
              <Box
                bg={t.surface} border="1px solid" borderColor={accentColor}
                borderRadius="2xl" px={6} py={4} w="100%"
              >
                <Text
                  fontSize="xs" mb={1}
                  color={score >= 1000 ? "#f5c518" : t.muted}
                  letterSpacing="0.15em"
                  textTransform="uppercase"
                  fontWeight={score >= 1000 ? "700" : "400"}
                  fontFamily={score >= 1000 ? "monospace" : t.font}
                >
                  {score >= 1000 ? "⭐ Perfect Score" : "Final Score"}
                </Text>
                <Text fontSize="4xl" fontWeight="black" color={score >= 1000 ? "#f5c518" : scoreColor} lineHeight={1}>
                  {score}
                </Text>
                <Box mb={3} />

                {/* Score breakdown */}
                <VStack gap={1} align="stretch" borderTop={`1px solid ${t.border}`} pt={3}>
                  {(() => {
                    const perfect = 900;
                    const deductPerGuess = Math.floor(perfect / maxGuesses);
                    const base = Math.max(50, perfect - (guesses.length - 1) * deductPerGuess);
                    const bonusAmt = durationSeconds != null
                      ? durationSeconds < 60 ? 300
                      : durationSeconds < 300 ? 200
                      : durationSeconds < 600 ? 75
                      : durationSeconds < 1800 ? 25
                      : 0 : 0;
                    return (
                      <>
                        <HStack justify="space-between">
                          <Text fontSize="xs" color={t.accent}>
                            Base ({guesses.length} guess{guesses.length !== 1 ? "es" : ""})
                          </Text>
                          <Text fontSize="xs" fontWeight="700" color={t.accent}>{base}</Text>
                        </HStack>
                        {bonusAmt > 0 && (() => {
                          const d = durationSeconds;
                          const tier = d < 60
                            ? { label: "< 1 min",   color: t.accent, bg: t.accent + "28" }
                            : d < 300
                            ? { label: "< 5 mins",  color: t.accent, bg: t.accent + "18" }
                            : d < 600
                            ? { label: "< 10 mins", color: t.muted,  bg: t.border + "66" }
                            : { label: "< 30 mins", color: t.muted,  bg: t.bg };
                          return (
                            <HStack justify="space-between">
                              <Box bg={tier.bg} borderRadius="full" px={1.5} py={0.5}>
                                <Text fontSize="9px" color={tier.color} fontFamily={t.font} fontWeight="700">{tier.label}</Text>
                              </Box>
                              <Text fontSize="xs" fontWeight="700" color={tier.color}>+{bonusAmt}</Text>
                            </HStack>
                          );
                        })()}
                        {bonusAmt === 0 && durationSeconds != null && (
                          <HStack justify="space-between">
                            <Text fontSize="xs" color={t.muted}>Time bonus</Text>
                            <Text fontSize="xs" fontWeight="700" color={t.muted}>+0</Text>
                          </HStack>
                        )}
                        <HStack justify="space-between" borderTop={`1px solid ${t.border}`} pt={1} mt={1}>
                          <Text fontSize="xs" fontWeight="700" color={t.muted}>Total</Text>
                          <Text fontSize="xs" fontWeight="800" color={scoreColor}>{score}{score >= 1000 ? " (max)" : ""}</Text>
                        </HStack>
                      </>
                    );
                  })()}
                </VStack>
              </Box>
            </motion.div>
          )}



          {/* Medal banner — daily only, when score is a new top-3 high score */}
          {isDaily && won && medalInfo && (() => {
            const cfg = MEDAL_CONFIG[medalInfo.medal];
            return (
              <motion.div
                initial={{ opacity: 0, scale: 0.85, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 2.4, type: "spring", stiffness: 220, damping: 18 }}
                style={{ width: "100%" }}
              >
                <Box
                  w="100%"
                  bg={cfg.bg}
                  border={`2px solid ${cfg.border}`}
                  borderRadius="2xl"
                  px={5} py={4}
                  textAlign="center"
                  boxShadow={`0 4px 18px ${cfg.color}44`}
                >
                  <Text fontSize="3xl" lineHeight={1} mb={1}>{cfg.emoji}</Text>
                  <Text fontSize="lg" fontWeight="800" color={cfg.color} fontFamily={t.font} lineHeight={1.1}>
                    {cfg.label}
                  </Text>
                  <Text fontSize="sm" color={t.muted} fontFamily={t.font} mt={1}>
                    You're #{medalInfo.rank} on today's leaderboard
                  </Text>
                </Box>
              </motion.div>
            );
          })()}

          {/* Buttons */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: won ? 2.2 : 1.6 }}
            style={{ width: "100%", display: "flex", flexDirection: "column", gap: "10px" }}
          >
            {onPlayAgain ? (
              <Button
                w="100%" bg={accentColor} color={t.white}
                size="lg" borderRadius={t.radiusMd}
                fontFamily={t.font} fontWeight="700"
                boxShadow={`0 4px 0 ${accentColor}cc`}
                onClick={onPlayAgain}
                _hover={{ opacity: 0.9, transform: "translateY(-1px)" }}
              >
                <ArrowClockwise size={16} weight="duotone" style={{ display: "inline", marginRight: 4, verticalAlign: "middle" }} />Play Again
              </Button>
            ) : (
              <Box
                w="100%" textAlign="center" py={3}
                bg={t.bg} border={`1px solid ${t.border}`} borderRadius={t.radiusMd}
              >
                <Text fontFamily={t.font} fontWeight="600" color={t.muted} fontSize="sm">
                  🕛 Come back tomorrow for the next one!
                </Text>
              </Box>
            )}
            {onPractice && (
              <Button
                w="100%" bg={t.surface} color={t.text}
                size="md" borderRadius={t.radiusMd}
                fontFamily={t.font} fontWeight="600"
                border={`2px solid ${t.border}`}
                onClick={onPractice}
                _hover={{ bg: t.bg }}
              >
                <DiceFive size={16} weight="duotone" style={{ display: "inline", marginRight: 6, verticalAlign: "middle" }} />Practice Mode
              </Button>
            )}
            <Button
              w="100%" bg={isDaily ? accentColor : t.surface} color={isDaily ? t.white : t.muted}
              size="md" borderRadius={t.radiusMd}
              fontFamily={t.font} fontWeight="600"
              border={isDaily ? "none" : `2px solid ${t.border}`}
              boxShadow={isDaily ? `0 4px 0 ${accentColor}cc` : "none"}
              onClick={() => navigate("/")}
              _hover={{ opacity: isDaily ? 0.9 : 1, bg: isDaily ? accentColor : t.bg, color: isDaily ? t.white : t.text }}
            >
              <HouseLine size={16} weight="duotone" style={{ display: "inline", marginRight: 6, verticalAlign: "middle" }} />Home
            </Button>
            {onShowStats && (
              <Button
                w="100%" bg={t.surface} color={t.muted}
                size="md" borderRadius={t.radiusMd}
                fontFamily={t.font} fontWeight="600"
                border={`2px solid ${t.border}`}
                onClick={onShowStats}
                _hover={{ bg: t.bg, color: t.text }}
              >
                <ChartBar size={16} weight="duotone" style={{ display: "inline", marginRight: 6, verticalAlign: "middle" }} />My Stats
              </Button>
            )}
          </motion.div>

        </VStack>
      </motion.div>
    </AnimatePresence>
  );
}
