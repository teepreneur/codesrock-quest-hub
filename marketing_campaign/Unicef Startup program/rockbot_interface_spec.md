# CodesRock: Rockbot Physical Interface Specification

This document defines the UI/UX standards for the **Rockbot** hardware, ensuring a seamless experience between the physical cards and the interactive robot.

## 1. Tactile Button Interface (Top Panel)
The Rockbot features a "Command Cluster" on its top surface, allowing for manual programming and immediate feedback. Each button matches the color and icon of its corresponding Logic Card.

| Button | Color | Hex Code | Function |
| :--- | :--- | :--- | :--- |
| **Move Forward** | Action Orange | `#FF7340` | Manual step forward. |
| **Turn Left** | Primary Blue | `#46C5D5` | Manual 90-degree left turn. |
| **Turn Right** | Growth Yellow | `#FDC82F` | Manual 90-degree right turn. |
| **Start/Play** | Deep Purple | `#5D3B98` | Execute the programmed sequence. |
| **Clear/Stop** | Bright Red | `#D32F2F` | Reset the current program. |

## 2. Visual Feedback (Glowing Antennae)
The Rockbot's antennae (inspired by Rocky) serve as the primary "Status UI."

*   **Logic Spark (Teal/Cyan Glow):** Slow pulse when waiting for a card to be scanned.
*   **Success (Vibrant Green):** Double-flash when a card is successfully read.
*   **Error (Soft Red):** Rapid flicker if an invalid command is scanned or the robot is blocked.
*   **Thinking (Soft Blue):** Rotating light pattern while calculating/executing a long sequence.

## 3. Audio UI (The "Sound of Logic")
*   **Scanning Sound:** A high-pitched "spark" or "ping" when a card is read.
*   **Execution Beat:** A rhythmic, Afro-pop inspired percussive sound for each movement step.
*   **Completion Fanfare:** A 2-second celebratory melody when the sequence finishes.

## 4. Hardware Interaction UX
1.  **Direct Mode:** Pressing a button on the robot moves it immediately (Teaching causality).
2.  **Program Mode:** Scanning cards builds a sequence in memory (Teaching algorithms).
3.  **Haptic Feedback:** Buttons have a distinct "click" feel (tactile satisfaction for small children).
