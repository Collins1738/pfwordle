import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Text, Heading, HStack, VStack, Avatar, Badge } from "@chakra-ui/react";
import { useAuth } from "../useAuth";
import { t } from "../theme";
import { DEV_ACCOUNTS } from "../constants";

const BASE_URL = import.meta.env.VITE_API_URL ?? "";

function formatDuration(secs) {
  if (!secs && secs !== 0) return "—";
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function formatTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    timeZone: "America/New_York",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function GuessRow({ guesses, word }) {
  return (
    <HStack gap={1} flexWrap="wrap">
      {guesses.map((g, i) => {
        const isCorrect = g.guess === word;
        const cells = g.result || [];
        return (
          <HStack key={i} gap="2px" title={g.guess}>
            {cells.map((c, j) => (
              <Box
                key={j}
                w="14px" h="14px"
                borderRadius="3px"
                bg={
                  c.status === "correct" ? t.correct :
                  c.status === "present" ? t.accentAlt :
                  t.absent
                }
                title={c.letter}
              />
            ))}
          </HStack>
        );
      })}
    </HStack>
  );
}

function formatName(name) {
  if (!name || name === "Anonymous") return "Anonymous";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

function GameCard({ game }) {
  const [expanded, setExpanded] = useState(false);
  const statusColor = game.status === "won" ? t.correct : game.status === "lost" ? "#e05252" : t.muted;
  const modeColor = game.mode === "practice" ? "#9b59b6" : t.accent;

  return (
    <Box
      bg={t.surface}
      border={`1px solid ${t.border}`}
      borderRadius={t.radiusMd}
      p={4}
      cursor="pointer"
      onClick={() => setExpanded(o => !o)}
      _hover={{ boxShadow: "0 4px 16px rgba(0,100,200,0.08)" }}
      transition="box-shadow 0.15s"
    >
      <HStack justifyContent="space-between" alignItems="flex-start" gap={3}>
        {/* Player */}
        <HStack gap={2} flex={1} minW={0}>
          <Avatar.Root size="sm" flexShrink={0}>
            {game.player_avatar ? <Avatar.Image src={`${BASE_URL}/api/avatar?url=${encodeURIComponent(game.player_avatar)}`} /> : null}
            <Avatar.Fallback bg={t.accent} color="white" fontSize="xs">
              {(game.player_name || "?")[0]}
            </Avatar.Fallback>
          </Avatar.Root>
          <Text fontWeight="700" color={t.text} fontSize="sm" fontFamily={t.font} noOfLines={1}>
            {formatName(game.player_name)}
          </Text>
        </HStack>

        {/* Word + badges */}
        <VStack alignItems="flex-end" gap={1} flexShrink={0}>
          <HStack gap={1}>
            <Badge
              px={2} py={0.5} borderRadius={t.radius} fontSize="xs"
              bg={modeColor + "22"} color={modeColor} fontFamily={t.font} fontWeight="700"
            >
              {game.mode}
            </Badge>
            <Badge
              px={2} py={0.5} borderRadius={t.radius} fontSize="xs"
              bg={statusColor + "22"} color={statusColor} fontFamily={t.font} fontWeight="700"
            >
              {game.status}
            </Badge>
          </HStack>
          <Text fontWeight="800" color={t.text} fontSize="md" fontFamily={t.font} letterSpacing="0.08em">
            {game.word}
          </Text>
        </VStack>
      </HStack>

      {/* Meta row */}
      <HStack gap={3} mt={2} flexWrap="wrap">
        <Text fontSize="xs" color={t.muted} fontFamily={t.font}>🕐 {formatTime(game.started_at)}</Text>
        {game.guess_count && <Text fontSize="xs" color={t.muted} fontFamily={t.font}>🎯 {game.guess_count} guess{game.guess_count !== 1 ? "es" : ""}</Text>}
        {game.duration_seconds != null && <Text fontSize="xs" color={t.muted} fontFamily={t.font}>⏱ {formatDuration(game.duration_seconds)}</Text>}
        {game.score != null && <Text fontSize="xs" color={t.muted} fontFamily={t.font}>⭐ {game.score} pts</Text>}
        <Text fontSize="xs" color={t.muted + "88"} fontFamily={t.font} ml="auto">
          {expanded ? "▲ hide" : "▼ guesses"}
        </Text>
      </HStack>

      {/* Expanded guess grid */}
      {expanded && (
        <Box mt={3} pt={3} borderTop={`1px solid ${t.border}`}>
          {game.guesses && game.guesses.length > 0 ? (
            <VStack alignItems="flex-start" gap={2}>
              {game.guesses.map((g, i) => (
                <HStack key={i} gap={2} alignItems="center">
                  <Text fontSize="xs" color={t.muted} fontFamily="monospace" w="18px" textAlign="right">{i + 1}.</Text>
                  <HStack gap="3px">
                    {(g.result || []).map((c, j) => (
                      <Box
                        key={j}
                        w="22px" h="22px"
                        borderRadius="4px"
                        display="flex" alignItems="center" justifyContent="center"
                        bg={
                          c.status === "correct" ? t.correct :
                          c.status === "present" ? t.accentAlt :
                          t.absent
                        }
                      >
                        <Text fontSize="10px" fontWeight="800" color="white" fontFamily="monospace">
                          {c.letter}
                        </Text>
                      </Box>
                    ))}
                  </HStack>
                  <Text fontSize="xs" color={t.muted} fontFamily="monospace">{g.guess}</Text>
                  {g.guessed_at && (
                    <Text fontSize="10px" color={t.muted + "88"} fontFamily={t.font}>
                      {formatTime(g.guessed_at)}
                    </Text>
                  )}
                </HStack>
              ))}
            </VStack>
          ) : (
            <Text fontSize="xs" color={t.muted} fontFamily={t.font}>No guesses recorded.</Text>
          )}
        </Box>
      )}
    </Box>
  );
}

export default function AdminPage() {
  const { user, getToken } = useAuth();
  const navigate = useNavigate();
  const [games, setGames] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modeFilter, setModeFilter] = useState(""); // "" | "daily" | "practice"
  const [dateFilter, setDateFilter] = useState("");
  const [page, setPage] = useState(0);
  const LIMIT = 50;

  const isAdmin = user && DEV_ACCOUNTS.includes(user.email);

  useEffect(() => {
    if (user === undefined) return; // auth still loading
    if (!isAdmin) { setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    setError(null);
    const token = getToken();
    const params = new URLSearchParams({ limit: LIMIT, offset: page * LIMIT });
    if (modeFilter) params.set("mode", modeFilter);
    if (dateFilter) params.set("date", dateFilter);
    fetch(`${BASE_URL}/api/admin/games?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.ok ? res.json() : res.json().then(d => Promise.reject(d.error || "Failed")))
      .then(data => { if (!cancelled) { setGames(data.games); setTotal(data.total); } })
      .catch(e => { if (!cancelled) setError(String(e)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [user, isAdmin, modeFilter, dateFilter, page]); // getToken intentionally omitted — stable localStorage read

  // Wait for auth to load
  if (user === undefined) return <Box minH="100vh" bg={t.bg} />;

  if (!isAdmin) {
    return (
      <Box minH="100vh" bg={t.bg} display="flex" alignItems="center" justifyContent="center">
        <Text color={t.muted} fontFamily={t.font}>Not authorized.</Text>
      </Box>
    );
  }

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <Box minH="100vh" bg={t.bg} fontFamily={t.font}>
      {/* Header */}
      <Box w="100%" bg={t.surface} borderBottom={`1px solid ${t.border}`} py={3} px={4}>
        <HStack maxW="900px" mx="auto" justifyContent="space-between">
          <HStack gap={3}>
            <Text
              fontSize="sm" color={t.accent} fontWeight="700" cursor="pointer"
              onClick={() => navigate("/")}
            >
              ← Back
            </Text>
            <Heading size="md" color={t.text} fontFamily={t.font} fontWeight="800">
              🛠 Admin — All Games
            </Heading>
          </HStack>
          <Text fontSize="xs" color={t.muted}>{total} total games</Text>
        </HStack>
      </Box>

      <Box maxW="900px" mx="auto" px={4} py={6}>
        {/* Filters */}
        <HStack gap={3} mb={5} flexWrap="wrap">
          <HStack gap={1}>
            <Text fontSize="sm" color={t.muted} fontWeight="600">Mode:</Text>
            {["", "daily", "practice"].map(m => (
              <Box
                key={m}
                as="button"
                px={3} py={1} borderRadius={t.radius} fontSize="xs" fontWeight="700"
                fontFamily={t.font} cursor="pointer"
                bg={modeFilter === m ? t.accent : t.surface}
                color={modeFilter === m ? "white" : t.muted}
                border={`1px solid ${modeFilter === m ? t.accent : t.border}`}
                onClick={() => { setModeFilter(m); setPage(0); }}
              >
                {m || "All"}
              </Box>
            ))}
          </HStack>
          <HStack gap={1}>
            <Text fontSize="sm" color={t.muted} fontWeight="600">Date:</Text>
            <Box
              as="input"
              type="date"
              value={dateFilter}
              onChange={e => { setDateFilter(e.target.value); setPage(0); }}
              px={2} py={1} borderRadius={t.radius} fontSize="xs"
              fontFamily={t.font} border={`1px solid ${t.border}`}
              bg={t.surface} color={t.text}
              _focus={{ outline: `2px solid ${t.accent}`, borderColor: t.accent }}
            />
            {dateFilter && (
              <Box
                as="button" px={2} py={1} fontSize="xs" color={t.muted}
                cursor="pointer" onClick={() => { setDateFilter(""); setPage(0); }}
                fontFamily={t.font}
              >
                ✕ clear
              </Box>
            )}
          </HStack>
        </HStack>

        {/* Content */}
        {loading ? (
          <Text color={t.muted} fontFamily={t.font} textAlign="center" py={8}>Loading…</Text>
        ) : error ? (
          <Text color="#e05252" fontFamily={t.font} textAlign="center" py={8}>{error}</Text>
        ) : games.length === 0 ? (
          <Text color={t.muted} fontFamily={t.font} textAlign="center" py={8}>No games found.</Text>
        ) : (
          <VStack gap={3} alignItems="stretch">
            {games.map(game => <GameCard key={game.id} game={game} />)}
          </VStack>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <HStack justifyContent="center" gap={2} mt={6}>
            <Box
              as="button" px={4} py={2} borderRadius={t.radius} fontSize="sm"
              fontFamily={t.font} fontWeight="700" cursor="pointer"
              bg={page > 0 ? t.accent : t.border} color={page > 0 ? "white" : t.muted}
              onClick={() => page > 0 && setPage(p => p - 1)}
              disabled={page === 0}
            >
              ← Prev
            </Box>
            <Text fontSize="sm" color={t.muted} fontFamily={t.font}>
              Page {page + 1} / {totalPages}
            </Text>
            <Box
              as="button" px={4} py={2} borderRadius={t.radius} fontSize="sm"
              fontFamily={t.font} fontWeight="700" cursor="pointer"
              bg={page < totalPages - 1 ? t.accent : t.border}
              color={page < totalPages - 1 ? "white" : t.muted}
              onClick={() => page < totalPages - 1 && setPage(p => p + 1)}
              disabled={page >= totalPages - 1}
            >
              Next →
            </Box>
          </HStack>
        )}
      </Box>
    </Box>
  );
}
