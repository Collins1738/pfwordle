import { VStack, HStack } from "@chakra-ui/react";
import Tile from "./Tile";

export default function Board({ guesses, currentGuess, currentRow, wordLength, maxGuesses }) {
  const rows = [];

  for (let i = 0; i < maxGuesses; i++) {
    if (i < guesses.length) {
      const { guess, result } = guesses[i];
      rows.push(
        <HStack key={i} gap="4px">
          {result.map((cell, j) => (
            <Tile key={j} letter={cell.letter} status={cell.status} delay={j * 0.1} wordLength={wordLength} />
          ))}
        </HStack>
      );
    } else if (i === currentRow) {
      const letters = currentGuess.split("").concat(Array(wordLength).fill("")).slice(0, wordLength);
      rows.push(
        <HStack key={i} gap="4px">
          {letters.map((letter, j) => (
            <Tile key={j} letter={letter} status={letter ? "tbd" : "empty"} wordLength={wordLength} />
          ))}
        </HStack>
      );
    } else {
      rows.push(
        <HStack key={i} gap="4px">
          {Array(wordLength).fill("").map((_, j) => (
            <Tile key={j} letter="" status="empty" wordLength={wordLength} />
          ))}
        </HStack>
      );
    }
  }

  return (
    <VStack gap="4px" my={3}>
      {rows}
    </VStack>
  );
}
