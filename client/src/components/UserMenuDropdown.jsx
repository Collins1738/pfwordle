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
import { Box, Text, HStack } from "@chakra-ui/react";
import { ChartBar, Wrench, Trophy, SignOut } from "@phosphor-icons/react";
import { useAuth } from "../useAuth";
import { t } from "../theme";

function MenuItem({ icon: Icon, label, onClick, color, bg, hoverBg, iconColor }) {
  return (
    <Box
      as="button" w="100%"
      bg={bg || t.bg} border={`1px solid ${t.border}`} borderRadius={t.radius}
      py={1.5} px={3} cursor="pointer"
      onClick={onClick}
      _hover={{ bg: hoverBg || t.border }}
    >
      <HStack gap={2} justifyContent="center">
        <Icon size={14} weight="duotone" color={iconColor || color || t.muted} />
        <Text fontSize="xs" fontWeight="700" fontFamily={t.font} color={color || t.text}>
          {label}
        </Text>
      </HStack>
    </Box>
  );
}

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
        <MenuItem
          icon={ChartBar}
          label="My Stats"
          onClick={() => go("/stats?mode=daily")}
          color={t.text}
          iconColor={t.accent}
        />
      )}

      {isAdmin && (
        <>
          <MenuItem
            icon={Wrench}
            label="Admin"
            onClick={() => go("/admin")}
            color={t.accent}
            iconColor={t.accent}
            bg={t.overlay}
            hoverBg={t.accent + "22"}
          />
          <MenuItem
            icon={Trophy}
            label="Hall of Fame"
            onClick={() => go("/hall-of-fame")}
            color="#f5a623"
            iconColor="#f5a623"
            bg={t.overlay}
            hoverBg="#f5a62322"
          />
        </>
      )}

      <MenuItem
        icon={SignOut}
        label="Sign out"
        onClick={() => { logout(); onClose(); }}
        color="#e05252"
        iconColor="#e05252"
        bg="#fff0f0"
        hoverBg="#ffe0e0"
      />
    </Box>
  );
}
