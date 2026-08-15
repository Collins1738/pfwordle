import { motion, AnimatePresence } from "framer-motion";
import { Box, Text, Button, VStack, HStack } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { DiceFive, ChartBar, House } from "@phosphor-icons/react";
import { t } from "../theme";

// Score out of 1000 based on guess count + time bonus
function calcScore(guessCount, maxGuesses, won, durationSeconds) {
  if (!won) return 0;
  const perfect = 900;
  const deductPerGuess = Math.floor(perfect / maxGuesses);
  const base = Math.max(50, perfect - (guessCount - 1) * deductPerGuess);

  let timeBonus = 0;
  if (durationSeconds != null) {
    if (durationSeconds < 60)        timeBonus = 100;
    else if (durationSeconds < 300)  timeBonus = 75;
    else if (durationSeconds < 600)  timeBonus = 50;
    else if (durationSeconds < 1800) timeBonus = 25;
  }

  return Math.min(1000, base + timeBonus);
}

function getScoreLabel(score) {
  if (score >= 900) return { label: "Genius 🧠",             color: "#f5c518" };
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
              w="22px" h="22px"
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
  if (durationSeconds < 60)        return "+100 ⚡ under 1 min";
  if (durationSeconds < 300)       return "+75 🔥 under 5 min";
  if (durationSeconds < 600)       return "+50 💨 under 10 min";
  if (durationSeconds < 1800)      return "+25 ⏱️ under 30 min";
  return null;
}

export default function ResultScreen({ won, answer, guesses, maxGuesses, wordLength, employee, durationSeconds, onPlayAgain, onShowStats, onPractice }) {
  const navigate = useNavigate();
  const accentColor = won ? t.accent : t.present;
  const score = calcScore(guesses.length, maxGuesses, won, durationSeconds);
  const { label: scoreLabelText, color: scoreColor } = getScoreLabel(score);

  const employees = Array.isArray(employee) ? employee : employee ? [employee] : [];
  const emp = employees[0];

  return (
    <AnimatePresence>
      <motion.div
        key="result-screen"
        initial={{ x: "100%", opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: "100%", opacity: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 30 }}
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
          <Text fontSize="lg" letterSpacing="0.1em" color={t.text} fontWeight="700" fontFamily={t.font}>
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

          {/* All guess rows + empty rows */}
          <VStack gap={1}>
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
                          w="22px" h="22px"
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

          {/* Score card */}
          {won && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.9, type: "spring", stiffness: 200 }}
              style={{ textAlign: "center" }}
            >
              <Box
                bg={t.surface} border="1px solid" borderColor={accentColor}
                borderRadius="2xl" px={8} py={4}
              >
                <Text fontSize="xs" color={t.muted} letterSpacing="0.15em" textTransform="uppercase" mb={1}>
                  Score
                </Text>
                <Text fontSize="4xl" fontWeight="black" color={scoreColor} lineHeight={1}>
                  {score}
                </Text>
                <Text fontSize="sm" color={scoreColor} mt={1}>{scoreLabelText}</Text>
                <Text fontSize="xs" color={t.muted} mt={2}>
                  {guesses.length} guess{guesses.length !== 1 ? "es" : ""}
                </Text>
                {timeBonusLabel(durationSeconds) && (
                  <Text fontSize="xs" color="#f5c518" mt={1} fontWeight="semibold">
                    {timeBonusLabel(durationSeconds)}
                  </Text>
                )}
              </Box>
            </motion.div>
          )}

          {/* Employee card */}
          {emp && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: won ? 1.2 : 0.6, duration: 0.4 }}
              style={{ width: "100%" }}
            >
              <Box
                w="100%" bg={t.surface}
                border="1px solid" borderColor={t.border}
                borderRadius="xl" overflow="hidden"
              >
                {/* Avatar banner */}
                <Box
                  h="80px" bg={accentColor}
                  display="flex" alignItems="flex-end" justifyContent="center"
                  pb={0} position="relative"
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
                        <Text fontSize="2xl" fontWeight="bold" color={t.white}>
                          {emp.fullName?.[0]}
                        </Text>
                      </Box>
                    )}
                  </Box>
                </Box>

                <VStack gap={1} pt="44px" pb={5} px={4} textAlign="center">
                  <Text fontSize="lg" fontWeight="700" fontFamily={t.font} color={t.text}>{emp.fullName}</Text>
                  {(emp.slackTitle || emp.title) && (
                    <Text fontSize="sm" color={t.muted}>{emp.slackTitle || emp.title}</Text>
                  )}
                  {emp.department && (
                    <Box
                      bg={accentColor + "22"} border="1px solid" borderColor={accentColor + "66"}
                      borderRadius="full" px={3} py={0.5} mt={1}
                    >
                      <Text fontSize="xs" color={accentColor} fontWeight="semibold">
                        {emp.department}
                      </Text>
                    </Box>
                  )}
                </VStack>
              </Box>
            </motion.div>
          )}

          {/* Buttons */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: won ? 1.5 : 0.9 }}
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
                Play Again
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
              w="100%" bg={t.surface} color={t.muted}
              size="md" borderRadius={t.radiusMd}
              fontFamily={t.font} fontWeight="600"
              border={`2px solid ${t.border}`}
              onClick={() => navigate("/")}
              _hover={{ bg: t.bg, color: t.text }}
            >
              <House size={16} weight="duotone" style={{ display: "inline", marginRight: 6, verticalAlign: "middle" }} />Home
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
