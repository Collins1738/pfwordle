/**
 * Shared user menu dropdown — used in both App.jsx (game header) and HomePage.jsx (auth strip).
 * Props:
 *   user        — auth user object
 *   isAdmin     — boolean
 *   onClose     — called when any item is clicked
 *   showStats   — show "My Stats" button (homepage only)
 *   showHeader  — show name + email at top (game header only)
 */
import { useNavigate } from "react-router-dom";
import { Box, Text } from "@chakra-ui/react";
import { useAuth } from "../useAuth";
import { t } from "../theme";

export default function UserMenuDropdown({ user, isAdmin, onClose, showStats = false, showHeader = false }) {
  const navigate = useNavigate();
  const { logout } = useAuth();

  function go(path) {
    onClose();
    navigate(path);
  }

  return (
    <Box display="flex" flexDir="column" gap={1.5} w="100%">
      {showHeader && (
        <>
          <Text color={t.text} fontFamily={t.font} fontSize="sm" fontWeight="600" noOfLines={1} mb={0.5}>
            {user.name}
          </Text>
          <Text color={t.muted} fontFamily={t.font} fontSize="xs" noOfLines={1} mb={1}>
            {user.email}
          </Text>
        </>
      )}

      {showStats && (
        <Box
          as="button" w="100%"
          bg={t.bg} border={`1px solid ${t.border}`} borderRadius={t.radius}
          py={1.5} px={3} color={t.text} fontSize="xs" fontWeight="700"
          fontFamily={t.font} cursor="pointer"
          onClick={() => go("/stats?mode=daily")}
          _hover={{ bg: t.border }}
        >
          📊 My Stats
        </Box>
      )}

      {isAdmin && (
        <>
          <Box
            as="button" w="100%" textAlign="center"
            bg={t.overlay} border={`1px solid ${t.border}`} borderRadius={t.radius}
            py={1.5} px={3} color={t.accent} fontSize="xs" fontWeight="700"
            fontFamily={t.font} cursor="pointer"
            onClick={() => go("/admin")}
            _hover={{ bg: t.accent + "22" }}
          >
            🛠 Admin
          </Box>
          <Box
            as="button" w="100%" textAlign="center"
            bg={t.overlay} border={`1px solid ${t.border}`} borderRadius={t.radius}
            py={1.5} px={3} color="#f5a623" fontSize="xs" fontWeight="700"
            fontFamily={t.font} cursor="pointer"
            onClick={() => go("/hall-of-fame")}
            _hover={{ bg: "#f5a62322" }}
          >
            🏆 Hall of Fame
          </Box>
        </>
      )}

      <Box
        as="button" w="100%" textAlign="center"
        bg="#fff0f0" border="1px solid #ffcccc" borderRadius={t.radius}
        py={1.5} px={3} color="#e05252" fontSize="xs" fontWeight="700"
        fontFamily={t.font} cursor="pointer"
        onClick={() => { logout(); onClose(); }}
        _hover={{ bg: "#ffe0e0" }}
      >
        Sign out
      </Box>
    </Box>
  );
}
