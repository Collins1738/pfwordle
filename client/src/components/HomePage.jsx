import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Heading, Text, VStack, Avatar, HStack, Skeleton, SkeletonCircle } from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDots, CheckCircle, XCircle } from "@phosphor-icons/react";
import { t } from "../theme";
import { useAuth } from "../useAuth";
import { resumeGame } from "../api";
import { DEV_ACCOUNTS } from "../constants";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL ?? "";

export default function HomePage() {
  const navigate = useNavigate();
  const { user, logout, getToken } = useAuth();
  const isDevAccount = user && DEV_ACCOUNTS.includes(user.email);

  const [dailyStatus, setDailyStatus] = useState(null); // null | "playing" | "won" | "lost"
  const [authMenuOpen, setAuthMenuOpen] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [toast, setToast] = useState(false);
  const toastTimer = useRef(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [weeklyLeaderboard, setWeeklyLeaderboard] = useState([]);
  const [loadingBoards, setLoadingBoards] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    resumeGame(token)
      .then(data => { if (data.hasGame) setDailyStatus(data.status); })
      .catch(() => {});
  }, [user]);

  const DUMMY_LEADERBOARD = import.meta.env.DEV ? [
    { name: "Sarah Johnson", avatar_url: null, guess_count: 2, status: "won" },
    { name: "Marcus Williams", avatar_url: null, guess_count: 3, status: "won" },
    { name: "Priya Patel", avatar_url: null, guess_count: 4, status: "won" },
    { name: "James Rodriguez", avatar_url: null, guess_count: 5, status: "won" },
    { name: "Emily Chen", avatar_url: null, guess_count: null, status: "lost" },
  ] : [];

  useEffect(() => {
    Promise.all([
      axios.get(`${BASE_URL}/api/leaderboard/daily`)
        .then(r => setLeaderboard(r.data.length > 0 ? r.data : DUMMY_LEADERBOARD))
        .catch(() => { if (import.meta.env.DEV) setLeaderboard(DUMMY_LEADERBOARD); }),
      axios.get(`${BASE_URL}/api/leaderboard/weekly`)
        .then(r => setWeeklyLeaderboard(r.data.length > 0 ? r.data : DUMMY_LEADERBOARD))
        .catch(() => { if (import.meta.env.DEV) setWeeklyLeaderboard(DUMMY_LEADERBOARD); }),
    ]).finally(() => setLoadingBoards(false));
  }, []);

  function handleDailyClick() {
    if (!user) {
      setShaking(true);
      setToast(true);
      setTimeout(() => setShaking(false), 500);
      clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setToast(false), 3000);
      return;
    }
    navigate("/daily");
  }

  function renderLeaderboard(data, title, statFn, topN, linkTo) {
    if (!data.length) return null;
    const userIdx = user ? data.findIndex(r => r.name === user.name) : -1;
    const topRows = data.slice(0, topN).map((row, i) => ({ row, position: i + 1 }));

    if (user && userIdx >= topN) {
      // User is outside topN — show them
      topRows.push({ row: data[userIdx], position: userIdx + 1 });
    } else if (data.length > topN) {
      // User is in topN (or not signed in) — show next row for context
      const alreadyShown = topRows.some(r => r.position === topN + 1);
      if (!alreadyShown) topRows.push({ row: data[topN], position: topN + 1 });
    }
    const medals = ["🥇", "🥈", "🥉"];
    return (
      <Box w="100%" bg={t.surface} border={`1px solid ${t.border}`} borderRadius="xl" overflow="hidden" cursor={linkTo ? "pointer" : "default"} onClick={linkTo ? () => navigate(linkTo) : undefined}>
        <HStack px={4} py={2.5} borderBottom={`1px solid ${t.border}`} justifyContent="space-between">
          <Text fontSize="xs" fontWeight="700" color={t.muted} fontFamily={t.font} letterSpacing="0.1em" textTransform="uppercase">
            {title}
          </Text>
          {linkTo && (
            <Text fontSize="xs" color={t.accent} fontFamily={t.font} fontWeight="600" cursor="pointer" onClick={() => navigate(linkTo)}>
              →
            </Text>
          )}
        </HStack>
        <VStack gap={0} align="stretch">
          {topRows.map(({ row, position }, i) => {
            const isYou = user && row.name === user.name;
            return (
              <HStack
                key={i} px={4} py={2} gap={3}
                borderBottom={i < topRows.length - 1 ? `1px solid ${t.border}` : "none"}
                bg={isYou ? t.accent + "11" : "transparent"}
              >
                <Text fontSize="sm" w="20px" textAlign="center" flexShrink={0} color={t.muted} fontFamily={t.font}>
                  {`#${position}`}
                </Text>
                <Avatar.Root size="xs" flexShrink={0}>
                  <Avatar.Image src={row.avatar_url} />
                  <Avatar.Fallback>{row.name?.[0]}</Avatar.Fallback>
                </Avatar.Root>
                <Text fontSize="sm" color={isYou ? t.accent : t.text} fontFamily={t.font} fontWeight={isYou ? "700" : "600"} flex={1} noOfLines={1}>
                  {(() => {
                    const parts = (row.name || "").trim().split(" ");
                    return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : parts[0];
                  })()}
                  {isYou && <Text as="span" color={t.muted} fontWeight="400"> (you)</Text>}
                </Text>
                <Text fontSize="xs" color={t.accent} fontFamily={t.font} fontWeight="700" flexShrink={0}>
                  {statFn(row)}
                </Text>
              </HStack>
            );
          })}
        </VStack>
      </Box>
    );
  }

  const hoursUntilMidnight = (() => {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const diff = midnight - now;
    const hrs = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    return hrs > 0 ? `${hrs}h left` : `${mins}m left`;
  })();

  const nextInText = (() => {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const diff = midnight - now;
    const hrs = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    return hrs > 0 ? `next in ${hrs}h` : `next in ${mins}m`;
  })();

  const dailyLabel = dailyStatus === "won"
    ? { icon: <><CheckCircle size={12} weight="duotone" /><span style={{ marginLeft: 3, fontSize: "10px", color: t.muted }}>{nextInText}</span></>, color: "#22c55e" }
    : dailyStatus === "lost"
    ? { icon: <><XCircle size={12} weight="duotone" /><span style={{ marginLeft: 3, fontSize: "10px", color: t.muted }}>{nextInText}</span></>, color: t.present }
    : dailyStatus === "playing"
    ? { text: "▶️ In progress", color: "#f5c518" }
    : user
    ? { text: `⏳ ${hoursUntilMidnight}`, color: t.muted }
    : null;

  const devModeOn = localStorage.getItem("devMode") === "true" || (isDevAccount && localStorage.getItem("devMode") === null);
  const [devMenuOpen, setDevMenuOpen] = useState(false);

  function toggleDevMode() {
    const next = !devModeOn;
    localStorage.setItem("devMode", String(next));
    window.location.reload();
  }

  async function resetDaily() {
    const token = getToken();
    await fetch(`${BASE_URL}/api/dev/reset-daily`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    setDailyStatus(null);
  }

  return (
    <>
    {devModeOn && isDevAccount && (
      <Box position="fixed" bottom="80px" right="16px" zIndex={9999}>
        <Box
          as="button"
          onClick={() => setDevMenuOpen(o => !o)}
          px={2} py={0.5}
          borderRadius="full"
          border="1px solid"
          borderColor={devMenuOpen ? "#f0c040" : "#555"}
          bg={devMenuOpen ? "#f0c04022" : "transparent"}
          color={devMenuOpen ? "#f0c040" : "#888"}
          cursor="pointer"
          fontFamily="monospace"
          fontWeight="bold"
          fontSize="sm"
        >
          🔧
        </Box>
        {devMenuOpen && (
          <Box
            mt={1} bg="#1a1a2e" border="1px dashed #444" borderRadius="md"
            px={3} py={2} display="flex" flexDir="column" gap={1} minW="140px"
          >
            <Box
              as="button"
              onClick={async () => { await resetDaily(); setDevMenuOpen(false); }}
              bg="#2e1a1a" color="#ff8080" border="1px solid #444" borderRadius="sm"
              px={2} py={1} fontSize="xs" fontFamily="monospace" cursor="pointer" w="100%"
              _hover={{ bg: "#3e1a1a" }}
            >
              🗑️ reset daily
            </Box>
            <Box
              as="button"
              onClick={toggleDevMode}
              bg="#2a2a2a" color="#888" border="1px solid #444" borderRadius="sm"
              px={2} py={1} fontSize="xs" fontFamily="monospace" cursor="pointer" w="100%"
              _hover={{ bg: "#333" }}
            >
              ✕ exit dev mode
            </Box>
          </Box>
        )}
      </Box>
    )}
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
          style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", zIndex: 9999 }}
        >
          <Box
            bg={t.text} color={t.white} px={5} py={2.5}
            borderRadius={t.radiusFull} fontSize="sm"
            fontFamily={t.font} fontWeight="600"
            boxShadow="0 4px 20px rgba(0,0,0,0.2)"
            whiteSpace="nowrap"
          >
            Sign in to play Daily 🔒
          </Box>
        </motion.div>
      )}
    </AnimatePresence>
    <Box
      minH="100vh"
      bg={t.bg}
      display="flex"
      flexDir="column"
      alignItems="center"
      justifyContent="center"
      px={6}
    >
      <VStack gap={4} textAlign="center" w="100%" maxW="400px">
        <VStack gap={1}>
          <Heading
            fontSize="3xl"
            letterSpacing="0.05em"
            color={t.text}
            fontWeight="700"
            fontFamily={t.font}
          >
            PERMITDLE
          </Heading>
          <Text fontSize="sm" color={t.muted} fontFamily={t.font} fontWeight="500">
            Guess the Permitflow employee
          </Text>
        </VStack>

        <VStack gap={3} w="100%">


          {/* Daily button */}
          <Box position="relative" w="100%">
            <motion.div
              animate={shaking ? { x: [0, -8, 8, -6, 6, -3, 3, 0] } : {}}
              transition={{ duration: 0.45 }}
              style={{ width: "100%" }}
            >
              {(() => {
                const done = dailyStatus === "won" || dailyStatus === "lost";
                return (
              <Box
                as="button"
                w="100%"
                py={3}
                borderRadius={t.radiusMd}
                bg={done ? t.border : t.accent}
                color={done ? t.muted : t.white}
                fontSize="lg"
                fontWeight="700"
                fontFamily={t.font}
                cursor="pointer"
                boxShadow={done ? `0 4px 0 ${t.border}` : `0 4px 0 ${t.accentDark}`}
                transition="all 0.3s ease"
                opacity={done ? 0.7 : 1}
                _hover={{ transform: "translateY(-2px)", boxShadow: done ? `0 6px 0 ${t.border}` : `0 6px 0 ${t.accentDark}` }}
                _active={{ transform: "translateY(3px)", boxShadow: done ? `0 1px 0 ${t.border}` : `0 1px 0 ${t.accentDark}` }}
                onClick={handleDailyClick}
              >
                <CalendarDots size={20} weight="duotone" style={{ display: "inline", marginRight: 8, verticalAlign: "middle" }} />Daily
              </Box>
                );
              })()}
            </motion.div>
            {dailyLabel && (
              <Box
                position="absolute" top="-10px" right="12px"
                bg={t.surface} border={`1px solid ${t.border}`}
                borderRadius={t.radiusFull} px={2} py={0.5}
              >
                <Box color={dailyLabel.color} display="flex" alignItems="center" fontFamily={t.font} fontSize="xs" fontWeight="700">
                  {dailyLabel.icon || dailyLabel.text}
                </Box>
              </Box>
            )}
          </Box>

          <Box
            as="button"
            w="100%"
            py={3}
            borderRadius={t.radiusMd}
            bg={t.surface}
            color={t.text}
            fontSize="lg"
            fontWeight="700"
            fontFamily={t.font}
            border={`2px solid ${t.border}`}
            cursor="pointer"
            boxShadow={`0 4px 0 ${t.border}`}
            transition="all 0.1s"
            _hover={{ transform: "translateY(-2px)", boxShadow: `0 6px 0 ${t.border}` }}
            _active={{ transform: "translateY(3px)", boxShadow: `0 1px 0 ${t.border}` }}
            onClick={() => navigate("/practice")}
          >
            🎯 Practice
          </Box>
        </VStack>

        {/* Weekly leaderboard — horizontal podium */}
        {loadingBoards ? (
          <Box w="100%" bg={t.surface} border={`1px solid ${t.border}`} borderRadius="xl" overflow="hidden">
            <Box px={4} py={2.5} borderBottom={`1px solid ${t.border}`} h="37px" display="flex" alignItems="center">
              <Skeleton h="10px" w="80px" borderRadius="full" />
            </Box>
            <HStack px={2} py={2} gap={0} h="110px">
              {[0,1,2].map(i => (
                <React.Fragment key={i}>
                  {i > 0 && <Box w="1px" bg={t.border} alignSelf="stretch" flexShrink={0} />}
                  <VStack flex={1} gap={1.5} align="center" justify="center">
                    <SkeletonCircle size="7" />
                    <Skeleton h="8px" w="50px" borderRadius="full" />
                    <Skeleton h="7px" w="30px" borderRadius="full" />
                  </VStack>
                </React.Fragment>
              ))}
            </HStack>
          </Box>
        ) : weeklyLeaderboard.length > 0 && (() => {
          const top3 = weeklyLeaderboard.slice(0, 3);
          const userIdx = user ? weeklyLeaderboard.findIndex(r => r.name === user.name) : -1;
          const isOutsideTop3 = user && userIdx >= 3;
          const medals = ["🥇", "🥈", "🥉"];
          return (
            <Box w="100%" bg={t.surface} border={`1px solid ${t.border}`} borderRadius="xl" overflow="hidden" cursor="pointer" onClick={() => navigate("/leaderboard/weekly")}>
              <HStack px={4} py={2.5} borderBottom={`1px solid ${t.border}`} justifyContent="space-between">
                <Text fontSize="xs" fontWeight="700" color={t.muted} fontFamily={t.font} letterSpacing="0.1em" textTransform="uppercase">
                  This Week
                </Text>
                <Text fontSize="xs" color={t.accent} fontFamily={t.font} fontWeight="600" cursor="pointer" onClick={() => navigate("/leaderboard/weekly")}>
                  →
                </Text>
              </HStack>
              <HStack px={2} py={2} gap={0} align="stretch">
                {top3.map((row, i) => {
                  const isYou = user && row.name === user.name;
                  const parts = (row.name || "").trim().split(" ");
                  const shortName = parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : parts[0];
                  return (
                    <React.Fragment key={i}>
                    {i > 0 && <Box w="1px" bg={t.border} alignSelf="stretch" flexShrink={0} />}
                    <VStack
                      flex={1} gap={0.5} align="center"
                      bg={isYou ? t.accent + "11" : "transparent"}
                      borderRadius="lg" py={1.5} px={1}
                    >
                      <Text fontSize="md">{medals[i]}</Text>
                      <Avatar.Root size="xs">
                        <Avatar.Image src={row.avatar_url} />
                        <Avatar.Fallback>{row.name?.[0]}</Avatar.Fallback>
                      </Avatar.Root>
                      <Text fontSize="10px" color={isYou ? t.accent : t.text} fontFamily={t.font} fontWeight="700" textAlign="center" noOfLines={1}>
                        {shortName}
                      </Text>
                      <Text fontSize="9px" color={t.accent} fontFamily={t.font} fontWeight="700">
                        {row.total_score ?? 0} pts
                      </Text>
                    </VStack>
                    </React.Fragment>
                  );
                })}
              </HStack>
              {isOutsideTop3 && (() => {
                const row = weeklyLeaderboard[userIdx];
                const parts = (row.name || "").trim().split(" ");
                const shortName = parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : parts[0];
                return (
                  <HStack px={4} py={2} gap={3} borderTop={`1px solid ${t.border}`} bg={t.accent + "11"}>
                    <Text fontSize="sm" color={t.muted} fontFamily={t.font} w="20px" textAlign="center">#{userIdx + 1}</Text>
                    <Avatar.Root size="xs">
                      <Avatar.Image src={row.avatar_url} />
                      <Avatar.Fallback>{row.name?.[0]}</Avatar.Fallback>
                    </Avatar.Root>
                    <Text fontSize="sm" color={t.accent} fontFamily={t.font} fontWeight="700" flex={1}>{shortName} <Text as="span" color={t.muted} fontWeight="400">(you)</Text></Text>
                    <Text fontSize="9px" color={t.accent} fontFamily={t.font} fontWeight="700">{row.total_score ?? 0} pts</Text>
                  </HStack>
                );
              })()}
            </Box>
          );
        })()}

        {/* Daily leaderboard — #1 + current user */}
        {loadingBoards ? (
          <Box w="100%" bg={t.surface} border={`1px solid ${t.border}`} borderRadius="xl" overflow="hidden">
            <Box px={4} py={2.5} borderBottom={`1px solid ${t.border}`} h="37px" display="flex" alignItems="center">
              <Skeleton h="10px" w="120px" borderRadius="full" />
            </Box>
            {[0,1].map(i => (
              <HStack key={i} px={4} py={2.5} gap={3} h="44px" borderBottom={i === 0 ? `1px solid ${t.border}` : "none"}>
                <Skeleton h="10px" w="24px" borderRadius="full" />
                <SkeletonCircle size="6" />
                <Skeleton h="10px" flex={1} borderRadius="full" />
                <Skeleton h="10px" w="60px" borderRadius="full" />
              </HStack>
            ))}
          </Box>
        ) : renderLeaderboard(leaderboard, "Today", (row) =>
          row.status === "won" ? `${row.guess_count} guess${row.guess_count !== 1 ? "es" : ""}` : "❌"
        , 1, "/leaderboard/daily")}

        {/* Auth strip */}
        <Box mt={4} w="100%" display="flex" justifyContent="center">
          {user === undefined ? (
            <Skeleton h="36px" w="160px" borderRadius="full" />
          ) : user ? (
            <Box position="relative">
              <HStack
                gap={2} bg={t.surface} border={`1px solid ${t.border}`} borderRadius={t.radiusFull}
                px={3} py={1.5} cursor="pointer"
                onClick={() => setAuthMenuOpen(o => !o)}
              >
                <Avatar.Root size="xs">
                  <Avatar.Image src={user.avatar} />
                  <Avatar.Fallback>{user.name?.[0]}</Avatar.Fallback>
                </Avatar.Root>
                <Text fontSize="sm" color={t.text} fontFamily={t.font} fontWeight="600">
                  {(() => {
                    const parts = (user.name || "").trim().split(" ");
                    return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : parts[0];
                  })()}
                </Text>
              </HStack>
              {authMenuOpen && (
                <>
                  <Box position="fixed" inset={0} zIndex={9} onClick={() => setAuthMenuOpen(false)} />
                  <Box
                    position="absolute" top="0" left="calc(100% + 8px)"
                    bg={t.surface} border={`1px solid ${t.border}`} borderRadius="xl"
                    p={3} zIndex={10} boxShadow="0 4px 20px rgba(0,100,200,0.1)" minW="140px" textAlign="center"
                  >
                    <Box
                      as="button" w="100%"
                      bg={t.bg} border={`1px solid ${t.border}`} borderRadius={t.radius}
                      py={1.5} px={3} color={t.text} fontSize="xs" fontWeight="700"
                      fontFamily={t.font} cursor="pointer" mb={1.5}
                      onClick={() => { setAuthMenuOpen(false); navigate("/stats?mode=daily"); }}
                      _hover={{ bg: t.border }}
                    >
                      My Stats
                    </Box>
                    <Box
                      as="button" w="100%"
                      bg="#fff0f0" border="1px solid #ffcccc" borderRadius={t.radius}
                      py={1.5} px={3} color="#e05252" fontSize="xs" fontWeight="700"
                      fontFamily={t.font} cursor="pointer"
                      onClick={() => { logout(); setAuthMenuOpen(false); }}
                      _hover={{ bg: "#ffe0e0" }}
                    >
                      Sign out
                    </Box>
                  </Box>
                </>
              )}
            </Box>
          ) : (
            <Box
              as="a" href={`${BASE_URL}/auth/google`}
              bg={t.accent} color={t.white} px={4} py={2} borderRadius={t.radiusFull}
              fontFamily={t.font} fontSize="sm" fontWeight="700" textDecoration="none"
              boxShadow={`0 3px 0 ${t.accentDark}`}
              _hover={{ opacity: 0.9 }}
            >
              Sign in
            </Box>
          )}
        </Box>
      </VStack>
    </Box>
    </>
  );
}
