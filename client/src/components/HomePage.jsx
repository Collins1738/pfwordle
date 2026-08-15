import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Heading, Text, VStack, Avatar, HStack } from "@chakra-ui/react";
import { t } from "../theme";
import { useAuth } from "../useAuth";
import { resumeGame } from "../api";

const BASE_URL = import.meta.env.VITE_API_URL ?? "";

export default function HomePage() {
  const navigate = useNavigate();
  const { user, logout, getToken } = useAuth();
  const [dailyStatus, setDailyStatus] = useState(null); // null | "playing" | "won" | "lost"

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    resumeGame(token)
      .then(data => { if (data.hasGame) setDailyStatus(data.status); })
      .catch(() => {});
  }, [user]);

  const dailyLabel = dailyStatus === "won"
    ? { text: "✅ Completed", color: t.accent }
    : dailyStatus === "lost"
    ? { text: "❌ Failed", color: t.present }
    : dailyStatus === "playing"
    ? { text: "▶️ In progress", color: "#f5c518" }
    : null;

  return (
    <Box
      minH="100vh"
      bg={t.bg}
      display="flex"
      flexDir="column"
      alignItems="center"
      justifyContent="center"
      px={6}
    >
      <VStack gap={8} textAlign="center" w="100%" maxW="400px">
        <VStack gap={2}>
          <Heading
            fontSize={{ base: "4xl", md: "5xl" }}
            letterSpacing="0.05em"
            color={t.text}
            fontWeight="700"
            fontFamily={t.font}
          >
            PERMITDLE
          </Heading>
          <Text fontSize="lg" color={t.muted} fontFamily={t.font} fontWeight="500">
            Guess the Permitflow employee
          </Text>
        </VStack>

        <VStack gap={4} w="100%">
          {/* Daily button */}
          <Box position="relative" w="100%">
            <Box
              as="button"
              w="100%"
              py={5}
              borderRadius={t.radiusMd}
              bg={t.accent}
              color={t.white}
              fontSize="xl"
              fontWeight="700"
              fontFamily={t.font}
              cursor="pointer"
              boxShadow={`0 5px 0 ${t.accentDark}`}
              transition="all 0.1s"
              _hover={{ transform: "translateY(-2px)", boxShadow: `0 7px 0 ${t.accentDark}` }}
              _active={{ transform: "translateY(3px)", boxShadow: `0 2px 0 ${t.accentDark}` }}
              onClick={() => navigate("/daily")}
            >
              📅 Daily
            </Box>
            {dailyLabel && (
              <Box
                position="absolute" top="-10px" right="12px"
                bg={t.surface} border={`1px solid ${t.border}`}
                borderRadius={t.radiusFull} px={2} py={0.5}
              >
                <Text fontSize="xs" fontWeight="700" color={dailyLabel.color} fontFamily={t.font}>
                  {dailyLabel.text}
                </Text>
              </Box>
            )}
          </Box>

          <Box
            as="button"
            w="100%"
            py={5}
            borderRadius={t.radiusMd}
            bg={t.surface}
            color={t.text}
            fontSize="xl"
            fontWeight="700"
            fontFamily={t.font}
            border={`2px solid ${t.border}`}
            cursor="pointer"
            boxShadow={`0 5px 0 ${t.border}`}
            transition="all 0.1s"
            _hover={{ transform: "translateY(-2px)", boxShadow: `0 7px 0 ${t.border}` }}
            _active={{ transform: "translateY(3px)", boxShadow: `0 2px 0 ${t.border}` }}
            onClick={() => navigate("/practice")}
          >
            🎯 Practice
          </Box>
        </VStack>

        <Text fontSize="sm" color={t.muted} fontFamily={t.font} mt={2}>
          Daily resets at midnight · Practice anytime
        </Text>

        {/* Auth strip */}
        <Box mt={4} w="100%" display="flex" justifyContent="center">
          {user === undefined ? null : user ? (
            <HStack gap={2} bg={t.surface} border={`1px solid ${t.border}`} borderRadius={t.radiusFull} px={3} py={1.5}>
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
              <Text
                fontSize="xs" color={t.muted} fontFamily={t.font} cursor="pointer"
                _hover={{ color: t.text }} onClick={logout}
              >
                · sign out
              </Text>
            </HStack>
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
  );
}
