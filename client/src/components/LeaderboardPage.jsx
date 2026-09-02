import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Box, VStack, Text, HStack, Avatar, Spinner, Heading } from "@chakra-ui/react";
import { motion, AnimatePresence, useMotionValue, animate } from "framer-motion";
import { Trophy } from "@phosphor-icons/react";
import axios from "axios";
import { t } from "../theme";
import { useAuth } from "../useAuth";

const BASE_URL = import.meta.env.VITE_API_URL ?? "";

const STATUS_COLORS = {
  correct: t.correct,
  present: t.present,
  absent:  t.absent,
  empty:   t.border,
};

function MiniBoard({ guesses, maxGuesses = 6, wordLength = 5, size = 8 }) {
  const rows = Array.from({ length: maxGuesses }, (_, i) => guesses[i] || null);
  return (
    <VStack gap="2px">
      {rows.map((g, i) => (
        <HStack key={i} gap="2px">
          {Array.from({ length: wordLength }, (_, j) => {
            const status = g?.result?.[j]?.status || "empty";
            return (
              <Box key={j} w={`${size}px`} h={`${size}px`} bg={STATUS_COLORS[status] || t.border} borderRadius="1px" flexShrink={0} />
            );
          })}
        </HStack>
      ))}
    </VStack>
  );
}

function shortNameFn(name) {
  const parts = (name || "").trim().split(" ");
  return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : parts[0];
}

function BoardModal({ row, onClose }) {
  if (!row) return null;
  const guesses = row.guesses || [];
  const wordLength = guesses[0]?.result?.length || 5;
  const maxGuesses = Math.max(6, guesses.length);
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{ position: "fixed", inset: 0, background: "rgba(0,50,120,0.4)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center" }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          onClick={e => e.stopPropagation()}
          style={{ width: "100%", maxWidth: "320px", margin: "0 16px" }}
        >
          <Box bg={t.surface} border={`1px solid ${t.border}`} borderRadius="2xl" overflow="hidden">
            <HStack px={4} py={3} borderBottom={`1px solid ${t.border}`} gap={3}>
              <Avatar.Root size="sm"><Avatar.Image src={row.avatar_url} /><Avatar.Fallback>{row.name?.[0]}</Avatar.Fallback></Avatar.Root>
              <VStack gap={0} align="flex-start" flex={1}>
                <Text fontSize="sm" fontWeight="700" color={t.text} fontFamily={t.font}>{shortNameFn(row.name)}</Text>
                <Text fontSize="xs" color={t.muted} fontFamily={t.font}>
                  {row.status === "won" ? `${row.guess_count} guess${row.guess_count !== 1 ? "es" : ""}` : "Did not get it"}
                </Text>
              </VStack>
              <Box as="button" color={t.muted} onClick={onClose} fontSize="lg" cursor="pointer" lineHeight={1}>✕</Box>
            </HStack>
            <Box p={4} display="flex" flexDir="column" alignItems="center" gap={3}>
              <VStack gap="4px">
                {Array.from({ length: maxGuesses }, (_, i) => {
                  const g = guesses[i];
                  return (
                    <HStack key={i} gap="4px">
                      {Array.from({ length: wordLength }, (_, j) => {
                        const status = g?.result?.[j]?.status || "empty";
                        return (
                          <Box key={j} w="36px" h="36px" bg={STATUS_COLORS[status] || "transparent"}
                            border={status === "empty" ? `2px solid ${t.border}` : "none"} borderRadius="6px"
                            display="flex" alignItems="center" justifyContent="center">
                            {g?.result?.[j]?.letter && (
                              <Text fontSize="sm" fontWeight="700" color={t.white} fontFamily={t.font}>{g.result[j].letter}</Text>
                            )}
                          </Box>
                        );
                      })}
                    </HStack>
                  );
                })}
              </VStack>
            </Box>
          </Box>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function ProfileModal({ row, onClose }) {
  if (!row) return null;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{ position: "fixed", inset: 0, background: "rgba(0,50,120,0.4)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center" }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          onClick={e => e.stopPropagation()}
          style={{ width: "100%", maxWidth: "320px", margin: "0 16px" }}
        >
          <Box bg={t.surface} border={`1px solid ${t.border}`} borderRadius="2xl" overflow="hidden">
            <HStack px={4} py={3} borderBottom={`1px solid ${t.border}`} gap={3} justifyContent="flex-end">
              <Box as="button" color={t.muted} onClick={onClose} fontSize="lg" cursor="pointer" lineHeight={1}>✕</Box>
            </HStack>
            <VStack px={6} py={6} gap={3} align="center">
              <Avatar.Root size="xl"><Avatar.Image src={row.avatar_url} /><Avatar.Fallback fontSize="2xl">{row.name?.[0]}</Avatar.Fallback></Avatar.Root>
              <VStack gap={1} align="center">
                <Text fontSize="lg" fontWeight="700" color={t.text} fontFamily={t.font} textAlign="center">{row.employee_full_name || row.name}</Text>
                {row.employee_title && <Text fontSize="sm" color={t.muted} fontFamily={t.font} textAlign="center">{row.employee_title}</Text>}
                {row.employee_department && (
                  <Box bg={t.accent + "22"} px={3} py={0.5} borderRadius="full">
                    <Text fontSize="xs" color={t.accent} fontFamily={t.font} fontWeight="600">{row.employee_department}</Text>
                  </Box>
                )}
              </VStack>
              {(() => {
                const isWeeklyRow = row.total_score !== undefined;
                const wins = isWeeklyRow ? row.wins : (row.status === "won" ? 1 : 0);
                const played = isWeeklyRow ? row.played : 1;
                const pts = isWeeklyRow ? row.total_score : (row.score ?? 0);
                return (
                  <HStack gap={4} pt={2}>
                    <VStack gap={0} align="center">
                      <Text fontSize="xl" fontWeight="700" color={t.accent} fontFamily={t.font}>{wins}</Text>
                      <Text fontSize="xs" color={t.muted} fontFamily={t.font}>wins</Text>
                    </VStack>
                    <VStack gap={0} align="center">
                      <Text fontSize="xl" fontWeight="700" color={t.text} fontFamily={t.font}>{played}</Text>
                      <Text fontSize="xs" color={t.muted} fontFamily={t.font}>played</Text>
                    </VStack>
                    <VStack gap={0} align="center">
                      <Text fontSize="xl" fontWeight="700" color={t.text} fontFamily={t.font}>{pts}</Text>
                      <Text fontSize="xs" color={t.muted} fontFamily={t.font}>pts</Text>
                    </VStack>
                  </HStack>
                );
              })()}
            </VStack>
          </Box>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

const TABS = ["daily", "weekly"];
const medals = ["🥇", "🥈", "🥉"];

function LeaderboardList({ data, loading, isWeekly, user, hasPlayedToday, shakingLock, onRowClick, onProfileClick }) {
  return (
    <VStack w="100%" maxW="520px" px={4} py={4} gap={0} align="stretch">
      {loading ? (
        <Box display="flex" justifyContent="center" py={12}><Spinner color={t.accent} /></Box>
      ) : data.length === 0 ? (
        <Text color={t.muted} textAlign="center" py={12} fontFamily={t.font}>No entries yet 👀</Text>
      ) : (
        <Box bg={t.surface} border={`1px solid ${t.border}`} borderRadius="xl" overflow="hidden">
          {isWeekly && (
            <HStack px={4} py={2} borderBottom={`1px solid ${t.border}`} justify="flex-end" gap={0}>
              <Text fontSize="10px" color={t.muted} fontFamily={t.font} fontWeight="600" letterSpacing="0.05em" textTransform="uppercase" w="16px" textAlign="right">P</Text>
              <Text fontSize="10px" color={t.muted} fontFamily={t.font} fontWeight="600" pl="6px" pr="3px">|</Text>
              <Text fontSize="10px" color={t.muted} fontFamily={t.font} fontWeight="600" letterSpacing="0.05em" textTransform="uppercase" w="52px" textAlign="center">pts</Text>
            </HStack>
          )}
          {data.map((row, i) => {
            const isYou = user && row.name === user.name;
            const wordLength = row.guesses?.[0]?.result?.length || 5;
            const maxGuesses = Math.max(6, row.guess_count || 6);
            return (
              <HStack
                key={i} px={4} py={3} gap={3}
                borderBottom={i < data.length - 1 ? `1px solid ${t.border}` : "none"}
                bg={isYou ? t.accent + "11" : "transparent"}
                cursor={isWeekly || (row.guesses?.length && hasPlayedToday) ? "pointer" : "default"}
                onClick={isWeekly ? () => onProfileClick(row) : (row.guesses?.length ? (e) => { e.stopPropagation(); onRowClick(row, i); } : undefined)}
                _hover={isWeekly || (row.guesses?.length && hasPlayedToday) ? { bg: isYou ? t.accent + "22" : t.bg } : {}}
                transition="background 0.1s"
              >
                <Text fontSize="sm" w="28px" textAlign="center" flexShrink={0} color={t.muted} fontFamily={t.font}>
                  {isWeekly ? (medals[i] || `#${i + 1}`) : `#${i + 1}`}
                </Text>
                <Avatar.Root size="sm" flexShrink={0} cursor="pointer" onClick={e => { e.stopPropagation(); onProfileClick(row); }}>
                  <Avatar.Image src={row.avatar_url} /><Avatar.Fallback>{row.name?.[0]}</Avatar.Fallback>
                </Avatar.Root>
                <VStack gap={0} align="flex-start" flex={1} minW={0}>
                  <HStack gap={1.5} w="100%">
                    <Text fontSize="sm" color={isYou ? t.accent : t.text} fontFamily={t.font} fontWeight={isYou ? "700" : "600"} noOfLines={1}
                      cursor="pointer" onClick={e => { e.stopPropagation(); onProfileClick(row); }}>
                      {shortNameFn(row.name)}
                      {isYou && <Text as="span" color={t.muted} fontWeight="400"> (you)</Text>}
                    </Text>
                  </HStack>
                  {!isWeekly && row.status === "won" && (
                    <HStack gap={1.5} mt={0.5}>
                      {row.duration_seconds != null && (() => {
                        const d = row.duration_seconds;
                        const tier = d < 60
                          ? { label: "< 1 min", color: t.accent, bg: t.accent + "28" }
                          : d < 300
                          ? { label: "< 5 mins", color: t.accent, bg: t.accent + "18" }
                          : d < 600
                          ? { label: "< 10 mins", color: t.muted, bg: t.border + "66" }
                          : d < 1800
                          ? { label: "< 30 mins", color: t.muted, bg: t.bg }
                          : null;
                        return tier ? (
                          <Box bg={tier.bg} borderRadius="full" px={1.5} py={0.5}>
                            <Text fontSize="9px" color={tier.color} fontFamily={t.font} fontWeight="700">{tier.label}</Text>
                          </Box>
                        ) : null;
                      })()}
                    </HStack>
                  )}
                </VStack>
                {!isWeekly && row.status === "lost" && (
                  <Text fontSize="xs" color={t.present} fontFamily={t.font} fontWeight="700" flexShrink={0}>❌</Text>
                )}
                {isWeekly && (
                  <HStack gap={0} flexShrink={0} align="center">
                    <Text fontSize="xs" color={t.muted} fontFamily={t.font} w="16px" textAlign="right">{row.played}</Text>
                    <Text fontSize="xs" color={t.muted} fontFamily={t.font} pl="6px" pr="3px">|</Text>
                    <Text fontSize="xs" color={t.accent} fontFamily={t.font} fontWeight="700" w="52px" textAlign="center">{row.total_score ?? 0} pts</Text>
                  </HStack>
                )}
                {!isWeekly && row.guesses?.length > 0 && (
                  <VStack gap={0.5} align="center" flexShrink={0}>
                    <Box position="relative">
                      <Box opacity={hasPlayedToday ? 0.75 : 1} style={hasPlayedToday ? {} : { filter: "blur(1.5px)" }}>
                        <MiniBoard guesses={row.guesses} maxGuesses={maxGuesses} wordLength={wordLength} size={5} />
                      </Box>
                      {!hasPlayedToday && (
                        <Box position="absolute" inset={0} display="flex" alignItems="center" justifyContent="center">
                          <Text fontSize="10px" lineHeight={1} className={shakingLock === i ? "lock-shaking" : ""} display="inline-block">🔒</Text>
                        </Box>
                      )}
                    </Box>
                    {row.score != null && hasPlayedToday && (
                      <Text fontSize="9px" color={t.accent} fontFamily={t.font} fontWeight="700">{row.score}pts</Text>
                    )}
                  </VStack>
                )}
              </HStack>
            );
          })}
        </Box>
      )}
    </VStack>
  );
}

export default function LeaderboardPage() {
  const { type } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const urlTabIndex = TABS.indexOf(type) === -1 ? 0 : TABS.indexOf(type);

  // Local tab state drives the visual position
  const [activeTab, setActiveTab] = useState(urlTabIndex);
  const isWeekly = activeTab === 1;

  const [dailyData, setDailyData] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [loadingDaily, setLoadingDaily] = useState(true);
  const [loadingWeekly, setLoadingWeekly] = useState(true);

  const [selectedRow, setSelectedRow] = useState(null);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [shakingLock, setShakingLock] = useState(null);
  const [showLockMsg, setShowLockMsg] = useState(false);

  const hasPlayedToday = user && dailyData.some(row => row.name === user.name);

  // The motion value that drives the strip's translateX.
  // strip is 200% wide; panel 0 starts at 0, panel 1 at -containerWidth.
  const x = useMotionValue(0);
  const containerRef = useRef(null);

  // Sync x when activeTab changes via tap (not swipe — swipe sets x first then calls switchToTab)
  const isSwiping = useRef(false);
  useEffect(() => {
    if (isSwiping.current) return; // swipe manages x itself
    const w = containerRef.current?.offsetWidth ?? window.innerWidth;
    animate(x, -activeTab * w, { type: "tween", ease: [0.25, 0.46, 0.45, 0.94], duration: 0.26 });
  }, [activeTab]);

  // If URL changes externally (back/forward), sync local state
  useEffect(() => {
    if (urlTabIndex !== activeTab) {
      setActiveTab(urlTabIndex);
    }
  }, [urlTabIndex]);

  useEffect(() => {
    axios.get(`${BASE_URL}/api/leaderboard/daily`)
      .then(r => setDailyData(r.data)).catch(() => setDailyData([]))
      .finally(() => setLoadingDaily(false));
    axios.get(`${BASE_URL}/api/leaderboard/weekly`)
      .then(r => setWeeklyData(r.data)).catch(() => setWeeklyData([]))
      .finally(() => setLoadingWeekly(false));
  }, []);

  function switchToTab(idx) {
    if (idx === activeTab) return;
    setActiveTab(idx);
    navigate(`/leaderboard/${TABS[idx]}`);
  }

  // Touch gesture state
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const touchBaseX = useRef(0);    // x.get() at touch start
  const gestureLock = useRef(null); // "horiz" | "vert" | null
  const lastVelocity = useRef(0);
  const lastTouchX = useRef(null);
  const lastTouchTime = useRef(null);

  function onTouchStart(e) {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchBaseX.current = x.get();
    gestureLock.current = null;
    lastVelocity.current = 0;
    lastTouchX.current = e.touches[0].clientX;
    lastTouchTime.current = Date.now();
    isSwiping.current = false;
  }

  function onTouchMove(e) {
    if (!touchStartX.current) return;
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;

    // Determine gesture direction once we have enough movement
    if (!gestureLock.current && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) {
      gestureLock.current = Math.abs(dx) > Math.abs(dy) ? "horiz" : "vert";
    }

    if (gestureLock.current !== "horiz") return;

    // Prevent page scroll while swiping horizontally
    e.preventDefault();

    isSwiping.current = true;

    const w = containerRef.current?.offsetWidth ?? window.innerWidth;
    const maxX = 0;
    const minX = -(TABS.length - 1) * w;

    // Rubber-band at edges
    let newX = touchBaseX.current + dx;
    if (newX > maxX) newX = maxX + (newX - maxX) * 0.2;
    if (newX < minX) newX = minX + (newX - minX) * 0.2;

    x.set(newX);

    // Track velocity for flick detection
    const now = Date.now();
    const dt = now - (lastTouchTime.current ?? now);
    if (dt > 0) {
      lastVelocity.current = (e.touches[0].clientX - (lastTouchX.current ?? e.touches[0].clientX)) / dt;
    }
    lastTouchX.current = e.touches[0].clientX;
    lastTouchTime.current = now;
  }

  function onTouchEnd(e) {
    if (gestureLock.current !== "horiz") {
      isSwiping.current = false;
      return;
    }

    const w = containerRef.current?.offsetWidth ?? window.innerWidth;
    const currentX = x.get();
    const velocity = lastVelocity.current; // px/ms

    // Decide target tab: flick (velocity > 0.3 px/ms) or crossed midpoint
    let targetTab = activeTab;
    const midpoint = touchBaseX.current - Math.sign(velocity || 0) * w * 0.1; // slight velocity nudge

    if (velocity < -0.3 && activeTab < TABS.length - 1) {
      targetTab = activeTab + 1;
    } else if (velocity > 0.3 && activeTab > 0) {
      targetTab = activeTab - 1;
    } else {
      // Snap to nearest tab based on current position
      targetTab = Math.round(-currentX / w);
      targetTab = Math.max(0, Math.min(TABS.length - 1, targetTab));
    }

    // Spring snap to target
    animate(x, -targetTab * w, {
      type: "spring",
      stiffness: 400,
      damping: 40,
      velocity: velocity * 1000, // framer expects px/s
    });

    isSwiping.current = false;

    if (targetTab !== activeTab) {
      setActiveTab(targetTab);
      navigate(`/leaderboard/${TABS[targetTab]}`);
    }

    touchStartX.current = null;
    gestureLock.current = null;
  }

  return (
    <>
      <style>{`
        @keyframes lock-shake {
          0%   { transform: rotate(0deg); }
          15%  { transform: rotate(-18deg); }
          35%  { transform: rotate(18deg); }
          55%  { transform: rotate(-12deg); }
          75%  { transform: rotate(10deg); }
          90%  { transform: rotate(-5deg); }
          100% { transform: rotate(0deg); }
        }
        .lock-shaking { animation: lock-shake 0.55s ease; }
      `}</style>

      {selectedRow && <BoardModal row={selectedRow} onClose={() => setSelectedRow(null)} />}
      {selectedProfile && <ProfileModal row={selectedProfile} onClose={() => setSelectedProfile(null)} />}

      <Box bg={t.bg} display="flex" flexDir="column" alignItems="center" fontFamily={t.font} style={{ height: "100dvh", overflow: "hidden" }}>

        {/* Sticky header + tabs */}
        <Box w="100%" bg={t.surface} borderBottom={`1px solid ${t.border}`} display="flex" flexDir="column" alignItems="center" flexShrink={0}>
          <Box w="100%" maxW="520px" py={3} px={4}>
            <HStack justifyContent="space-between" alignItems="center">
              <Box as="button" onClick={() => navigate("/")} color={t.muted} fontSize="sm" cursor="pointer" fontFamily={t.font} _hover={{ color: t.text }}>
                ← Home
              </Box>
              <HStack gap={2}>
                <Trophy size={18} weight="duotone" color={t.accent} />
                <Heading size="sm" color={t.text} fontFamily={t.font}>{isWeekly ? "This Week" : "Today"}</Heading>
              </HStack>
              <Box w="48px" />
            </HStack>
          </Box>

          {/* Tabs */}
          <Box w="100%" maxW="520px" display="flex">
            {TABS.map((tab, i) => (
              <Box
                key={tab} flex={1} textAlign="center" py={2} cursor="pointer"
                color={activeTab === i ? t.accent : t.muted}
                fontWeight={activeTab === i ? "700" : "500"}
                fontFamily={t.font} fontSize="sm"
                borderBottom={activeTab === i ? `2px solid ${t.accent}` : "2px solid transparent"}
                transition="color 0.2s, border-color 0.2s"
                onClick={() => switchToTab(i)}
              >
                {tab === "daily" ? "Today" : "This Week"}
              </Box>
            ))}
          </Box>
        </Box>

        {/* Lock toast */}
        <Box
          position="fixed" bottom="24px" left="50%" zIndex={200}
          style={{ transform: "translateX(-50%)", transition: "opacity 0.3s", opacity: showLockMsg ? 1 : 0, pointerEvents: "none" }}
        >
          <Box bg={t.text} color="white" px={4} py={2} borderRadius={t.radiusFull} fontFamily={t.font} fontSize="sm" fontWeight="600" boxShadow="0 4px 16px rgba(0,0,0,0.2)" whiteSpace="nowrap">
            🔒 Play today's daily to view (no cheating 😄)
          </Box>
        </Box>

        {/* Swipe container */}
        <Box
          ref={containerRef}
          w="100%" flex={1}
          style={{ overflow: "hidden", position: "relative", touchAction: "pan-y" }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* Strip: 200% wide, contains both panels side by side */}
          <motion.div style={{ display: "flex", width: "200%", height: "100%", x }}>
            {/* Daily panel */}
            <div style={{ width: "50%", height: "100%", overflowY: "scroll", WebkitOverflowScrolling: "touch", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <LeaderboardList
                data={dailyData} loading={loadingDaily} isWeekly={false}
                user={user} hasPlayedToday={hasPlayedToday} shakingLock={shakingLock}
                onRowClick={(row, i) => {
                  if (hasPlayedToday) { setSelectedRow(row); }
                  else {
                    setShakingLock(i); setShowLockMsg(true);
                    setTimeout(() => setShakingLock(null), 600);
                    setTimeout(() => setShowLockMsg(false), 3000);
                  }
                }}
                onProfileClick={setSelectedProfile}
              />
            </div>
            {/* Weekly panel */}
            <div style={{ width: "50%", height: "100%", overflowY: "scroll", WebkitOverflowScrolling: "touch", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <LeaderboardList
                data={weeklyData} loading={loadingWeekly} isWeekly={true}
                user={user} hasPlayedToday={hasPlayedToday} shakingLock={null}
                onRowClick={() => {}}
                onProfileClick={setSelectedProfile}
              />
            </div>
          </motion.div>
        </Box>
      </Box>
    </>
  );
}
