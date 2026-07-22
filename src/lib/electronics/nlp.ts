import { Command, AddComponentCommand, ConnectPinsCommand, UpdatePropertyCommand } from './commands';
import { callOpenAILikeAPI, type ChatMessage } from '../huggingFaceService';

export interface ClarificationQuestion {
  id: string;
  text: string;
  options: string[];
  defaultValue: string;
}

export interface NLPResult {
  status: 'success' | 'clarification_needed' | 'error';
  explanation: string;
  commands: any[]; // JSON commands representing DSL
  questions?: ClarificationQuestion[];
}

export function parseNaturalLanguageRoute(
  prompt: string,
  resolvedParams: Record<string, string> = {}
): NLPResult {
  const normalized = prompt.toLowerCase().trim();

  // 1. CLEAR / RESET COMMAND
  if (normalized === 'clear' || normalized === 'clear circuit' || normalized === 'reset') {
    return {
      status: 'success',
      explanation: 'I am clearing the workspace canvas to start fresh.',
      commands: [
        { action: 'CLEAR_ALL' }
      ]
    };
  }

  // 2. FULL ADDER LOGIC CIRCUIT
  if (normalized.includes('adder') || normalized.includes('full adder') || normalized.includes('fulladder')) {
    const commands = [
      // Spawning 2 XOR Gates, 2 AND Gates, 1 OR Gate
      { action: 'ADD_COMPONENT', type: 'xor_gate', id: 'XOR1', x: 200, y: 100 },
      { action: 'ADD_COMPONENT', type: 'xor_gate', id: 'XOR2', x: 420, y: 150 },
      { action: 'ADD_COMPONENT', type: 'and_gate', id: 'AND1', x: 200, y: 320 },
      { action: 'ADD_COMPONENT', type: 'and_gate', id: 'AND2', x: 420, y: 400 },
      { action: 'ADD_COMPONENT', type: 'or_gate', id: 'OR1', x: 640, y: 280 },

      // Hooking up XOR1 (A ^ B)
      // Connect XOR1 A1 and B1 inputs (Inputs A and B)
      // XOR1 output is Y1. XOR2 input is A1 (which is A ^ B). XOR2 B1 input is Cin.
      { action: 'CONNECT_PINS', fromId: 'XOR1', fromPin: 'Y1', toId: 'XOR2', toPin: 'A1' },

      // Hooking up AND1 (A & B)
      // Connect AND1 inputs to A and B (represented by XOR1 inputs)
      // Since we don't have separate input nodes in this simple model, we connect AND1 to XOR1 inputs
      { action: 'CONNECT_PINS', fromId: 'XOR1', fromPin: 'A1', toId: 'AND1', toPin: 'A1' },
      { action: 'CONNECT_PINS', fromId: 'XOR1', fromPin: 'B1', toId: 'AND1', toPin: 'B1' },

      // Hooking up AND2 ((A ^ B) & Cin)
      // One input is XOR1 output (A ^ B), the other is Cin (which is XOR2 B1)
      { action: 'CONNECT_PINS', fromId: 'XOR1', fromPin: 'Y1', toId: 'AND2', toPin: 'A1' },
      { action: 'CONNECT_PINS', fromId: 'XOR2', fromPin: 'B1', toId: 'AND2', toPin: 'B1' },

      // Hooking up OR1 ((A & B) | ((A ^ B) & Cin))
      // Inputs are AND1 output and AND2 output
      { action: 'CONNECT_PINS', fromId: 'AND1', fromPin: 'Y1', toId: 'OR1', toPin: 'A1' },
      { action: 'CONNECT_PINS', fromId: 'AND2', fromPin: 'Y1', toId: 'OR1', toPin: 'B1' },
    ];

    return {
      status: 'success',
      explanation: 'I have compiled a 1-bit Digital Full Adder circuit. This design maps five logic gates (2x XOR, 2x AND, 1x OR) to calculate the Sum and Carry outputs from your inputs.',
      commands,
    };
  }

  // 3. ARDUINO + LED + RESISTOR CIRCUIT
  if (normalized.includes('arduino') && normalized.includes('led')) {
    // Check parameters
    const hasResistorText = normalized.includes('resistor') || normalized.includes('ohm') || normalized.includes('220');
    
    // Check if we already have answers to clarification questions
    const useResistor = resolvedParams['resistor'] !== undefined 
      ? resolvedParams['resistor'] === 'yes' 
      : hasResistorText || undefined;
      
    // Find target Arduino GPIO pin
    let pinMatch = normalized.match(/d\d+/);
    let arduinoPin = resolvedParams['arduino_pin'] || (pinMatch ? pinMatch[0].toUpperCase() : undefined);

    // Let's check LED color
    let ledColor = 'red';
    if (normalized.includes('green')) ledColor = 'green';
    else if (normalized.includes('blue')) ledColor = 'blue';
    else if (normalized.includes('yellow')) ledColor = 'yellow';
    else if (normalized.includes('white')) ledColor = 'white';

    // If any required parameter is missing, ask for clarification
    const questions: ClarificationQuestion[] = [];
    
    if (useResistor === undefined) {
      questions.push({
        id: 'resistor',
        text: 'Should we add a current-limiting resistor to protect the LED from burning out?',
        options: ['Yes, add a 220Ω Resistor (Recommended)', 'No, connect directly'],
        defaultValue: 'Yes, add a 220Ω Resistor (Recommended)',
      });
    }

    if (arduinoPin === undefined) {
      questions.push({
        id: 'arduino_pin',
        text: 'Which GPIO pin on the Arduino Uno should control the LED?',
        options: ['D13 (Onboard LED Pin)', 'D12', 'D11 (PWM)', 'D3 (PWM)'],
        defaultValue: 'D13 (Onboard LED Pin)',
      });
    }

    if (questions.length > 0) {
      return {
        status: 'clarification_needed',
        explanation: 'I found an Arduino Uno and an LED in your request, but I need a few details to build the circuit safely and correctly.',
        commands: [],
        questions,
      };
    }

    // Resolve specific values from options
    const finalUseResistor = resolvedParams['resistor'] 
      ? resolvedParams['resistor'].includes('Yes') || resolvedParams['resistor'] === 'yes'
      : !!useResistor;
      
    let finalPin = arduinoPin || 'D13';
    if (finalPin.includes('D13')) finalPin = 'D13';
    else if (finalPin.includes('D12')) finalPin = 'D12';
    else if (finalPin.includes('D11')) finalPin = 'D11';
    else if (finalPin.includes('D3')) finalPin = 'D3';

    const commands: any[] = [
      { action: 'ADD_COMPONENT', type: 'arduino_uno', id: 'MCU1', x: 80, y: 120 },
      { action: 'ADD_COMPONENT', type: 'led', id: 'LED1', x: 550, y: 220, properties: { color: ledColor } }
    ];

    if (finalUseResistor) {
      commands.push(
        { action: 'ADD_COMPONENT', type: 'resistor', id: 'R1', x: 380, y: 200, properties: { resistance: '220Ω' } },
        { action: 'CONNECT_PINS', fromId: 'MCU1', fromPin: finalPin, toId: 'R1', toPin: 'p1' },
        { action: 'CONNECT_PINS', fromId: 'R1', fromPin: 'p2', toId: 'LED1', toPin: 'anode' }
      );
    } else {
      commands.push(
        { action: 'CONNECT_PINS', fromId: 'MCU1', fromPin: finalPin, toId: 'LED1', toPin: 'anode' }
      );
    }

    // Connect LED cathode to Ground
    commands.push(
      { action: 'CONNECT_PINS', fromId: 'LED1', fromPin: 'cathode', toId: 'MCU1', toPin: 'GND_1' }
    );

    return {
      status: 'success',
      explanation: `I have compiled the commands to connect the Arduino Uno to a ${ledColor} LED. The anode is connected to Arduino pin **${finalPin}** ${finalUseResistor ? 'through a 220Ω resistor' : 'directly'}, and the cathode returns to **GND** to complete the circuit path.`,
      commands,
    };
  }

  // 4. BATTERY + CAPACITOR
  if ((normalized.includes('battery') || normalized.includes('9v')) && normalized.includes('cap')) {
    let capVal = '10µF';
    if (normalized.includes('100n') || normalized.includes('100nf')) capVal = '100nF';
    else if (normalized.includes('1u') || normalized.includes('1µf')) capVal = '1µF';
    else if (normalized.includes('100u') || normalized.includes('100µf')) capVal = '100µF';

    return {
      status: 'success',
      explanation: `I have compiled a simple DC Capacitor charging loop using a 9V Battery and a ${capVal} electrolytic capacitor.`,
      commands: [
        { action: 'ADD_COMPONENT', type: 'battery_9v', id: 'BAT1', x: 120, y: 100 },
        { action: 'ADD_COMPONENT', type: 'capacitor', id: 'CAP1', x: 360, y: 130, properties: { capacitance: capVal } },
        { action: 'CONNECT_PINS', fromId: 'BAT1', fromPin: 'positive', toId: 'CAP1', toPin: 'p1' },
        { action: 'CONNECT_PINS', fromId: 'CAP1', fromPin: 'p2', toId: 'BAT1', toPin: 'negative' },
      ],
    };
  }

  // 5. GENERIC SINGLE ADD COMPONENT ACTIONS
  if (normalized.startsWith('add') || normalized.startsWith('spawn')) {
    if (normalized.includes('arduino') || normalized.includes('uno')) {
      return {
        status: 'success',
        explanation: 'Spawning an Arduino Uno board on the board.',
        commands: [{ action: 'ADD_COMPONENT', type: 'arduino_uno', id: 'MCU_' + Math.floor(Math.random() * 100), x: 200, y: 150 }]
      };
    }
    if (normalized.includes('resistor')) {
      let rVal = '220Ω';
      if (normalized.includes('10k')) rVal = '10kΩ';
      else if (normalized.includes('1k')) rVal = '1kΩ';
      return {
        status: 'success',
        explanation: `Spawning a ${rVal} resistor.`,
        commands: [{ action: 'ADD_COMPONENT', type: 'resistor', id: 'R_' + Math.floor(Math.random() * 100), x: 250, y: 200, properties: { resistance: rVal } }]
      };
    }
    if (normalized.includes('led')) {
      return {
        status: 'success',
        explanation: 'Spawning a red LED.',
        commands: [{ action: 'ADD_COMPONENT', type: 'led', id: 'LED_' + Math.floor(Math.random() * 100), x: 250, y: 200 }]
      };
    }
    if (normalized.includes('battery')) {
      return {
        status: 'success',
        explanation: 'Spawning a 9V Battery.',
        commands: [{ action: 'ADD_COMPONENT', type: 'battery_9v', id: 'BAT_' + Math.floor(Math.random() * 100), x: 250, y: 200 }]
      };
    }
  }

  // 6. GENERAL FALLBACK PARSER
  // We extract components present and build a list. If not matching specific ones:
  return {
    status: 'error',
    explanation: 'Sorry, I couldn\'t fully compile that description. Try describing a circuit like:\n\n- *"Connect an Arduino Uno to a blue LED"* or\n- *"Build a full adder circuit"* or\n- *"Connect a 9V battery to a 10uF capacitor"*',
    commands: [],
  };
}

const ELECTRONICS_SYSTEM_INSTRUCTION = `You are Alpha, an AI Electronics Assistant. Compile request into a valid JSON object matching:
{
  "status": "success" | "clarification_needed" | "error",
  "explanation": "Brief 2-3 sentence explanation",
  "commands": [ /* commands if success */ ],
  "questions": [ /* questions if clarification_needed */ ]
}

Components: "arduino_uno", "resistor" (property "resistance"), "led" (property "color"), "capacitor" (property "capacitance"), "battery_9v", "xor_gate", "and_gate", "or_gate".
Commands:
- {"action": "CLEAR_ALL"}
- {"action": "ADD_COMPONENT", "type": "TYPE", "id": "ID", "x": X, "y": Y, "properties": {...}}
- {"action": "CONNECT_PINS", "fromId": "ID", "fromPin": "PIN", "toId": "ID", "toPin": "PIN"}

Arduino pins: D0-D13, A0-A5, 5V, 3.3V, GND_1, GND_2, GND_3. LED: anode, cathode. Resistor/Capacitor: p1, p2. Logic gates: A1, B1, Y1.
If details are missing (e.g. resistor needed for LED on Arduino, or GPIO pin not specified), set status to "clarification_needed" and return standard clarification questions.`;

export async function parseNaturalLanguageRouteAsync(
  prompt: string,
  resolvedParams: Record<string, string> = {}
): Promise<NLPResult> {
  const deepseekKey = (import.meta.env.VITE_DEEPSEEK_API_KEY as string) ?? '';
  const hfKey = (import.meta.env.VITE_HUGGINGFACE_API_KEY as string) ?? '';

  if (!deepseekKey && (!hfKey || hfKey === 'your_hf_token_here')) {
    // Fall back to offline local compiler if no key is configured
    return parseNaturalLanguageRoute(prompt, resolvedParams);
  }

  try {
    const messages: ChatMessage[] = [
      { role: 'system', content: ELECTRONICS_SYSTEM_INSTRUCTION },
      { 
        role: 'user', 
        content: `Prompt: "${prompt}"\nResolved Parameters: ${JSON.stringify(resolvedParams)}` 
      }
    ];

    const apiResponse = await callOpenAILikeAPI(messages, true);
    const parsed: NLPResult = JSON.parse(apiResponse);
    return parsed;
  } catch (err) {
    console.warn('[NLP API] Error executing LLM parsing, falling back to local:', err);
    return parseNaturalLanguageRoute(prompt, resolvedParams);
  }
}

