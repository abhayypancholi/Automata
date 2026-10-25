/**
 * Finite-state transducer (Mealy machine) for number system conversion
 * 
 * A transducer is a finite automaton with output:
 * - States represent partial computation
 * - Transitions produce output symbols
 * - Final output emitted when input ends
 */

import type { StateId } from '../automaton/types';

export interface TransducerTransition {
  from: StateId;
  input: string;
  to: StateId;
  output: string;
}

export interface Transducer {
  states: StateId[];
  inputAlphabet: string[];
  outputAlphabet: string[];
  start: StateId;
  transitions: TransducerTransition[];
  finalOutput: Record<StateId, string>; // Output when input ends in this state
}

export interface TransducerTraceStep {
  index: number;
  input: string;
  state: StateId;
  output: string;
  description: string;
}

export interface TransducerResult {
  output: string;
  trace: TransducerTraceStep[];
}

/**
 * Run a transducer on input string
 */
export function runTransducer(transducer: Transducer, input: string): TransducerResult {
  const trace: TransducerTraceStep[] = [];
  let currentState = transducer.start;
  let output = '';
  
  // Add initial state
  trace.push({
    index: -1,
    input: '',
    state: currentState,
    output: '',
    description: `Start in state ${currentState}`,
  });
  
  // Process each input symbol
  for (let i = 0; i < input.length; i++) {
    const symbol = input[i]!;
    
    // Find transition
    const transition = transducer.transitions.find(
      t => t.from === currentState && t.input === symbol
    );
    
    if (!transition) {
      throw new Error(`No transition from state ${currentState} on input '${symbol}'`);
    }
    
    output += transition.output;
    currentState = transition.to;
    
    trace.push({
      index: i,
      input: symbol,
      state: currentState,
      output: transition.output,
      description: `Read '${symbol}', output '${transition.output}', move to ${currentState}`,
    });
  }
  
  // Add final output if any
  const finalOut = transducer.finalOutput[currentState];
  if (finalOut) {
    output += finalOut;
    trace.push({
      index: input.length,
      input: '',
      state: currentState,
      output: finalOut,
      description: `End of input: emit final output '${finalOut}' from state ${currentState}`,
    });
  }
  
  return { output, trace };
}

/**
 * Build binary to octal transducer (LSB first)
 * 
 * States represent bits read so far in current group (0-2 bits for octal)
 * When 3rd bit arrives, emit the octal digit and reset to empty state
 * 
 * State naming convention: bits stored in the order they were read (LSB first)
 * E.g., if we read bits 0, then 1, the state is "01" (bit0=0, bit1=1)
 * 
 * When we complete a 3-bit group by reading bit2, the value is:
 * bit0*1 + bit1*2 + bit2*4
 * 
 * States: 7 total
 * - '' (empty): no bits in current group
 * - '0', '1': one bit
 * - '00', '01', '10', '11': two bits
 */
export function buildBinaryToOctalTransducer(): Transducer {
  const states: StateId[] = ['', '0', '1', '00', '01', '10', '11'];
  const transitions: TransducerTransition[] = [];
  const finalOutput: Record<StateId, string> = {};
  
  // From empty state: store first bit
  transitions.push({ from: '', input: '0', to: '0', output: '' });
  transitions.push({ from: '', input: '1', to: '1', output: '' });
  
  // From 1-bit states to 2-bit states: append new bit to state
  transitions.push({ from: '0', input: '0', to: '00', output: '' });
  transitions.push({ from: '0', input: '1', to: '01', output: '' });
  transitions.push({ from: '1', input: '0', to: '10', output: '' });
  transitions.push({ from: '1', input: '1', to: '11', output: '' });
  
  // From 2-bit states: read 3rd bit, compute value, emit digit, go to empty
  // State "XY" means bit0=X, bit1=Y; reading bit2=Z gives value X*1 + Y*2 + Z*4
  // where X = state[0], Y = state[1], Z = input
  transitions.push({ from: '00', input: '0', to: '', output: '0' }); // 0*1 + 0*2 + 0*4 = 0
  transitions.push({ from: '00', input: '1', to: '', output: '4' }); // 0*1 + 0*2 + 1*4 = 4
  transitions.push({ from: '01', input: '0', to: '', output: '2' }); // 0*1 + 1*2 + 0*4 = 2
  transitions.push({ from: '01', input: '1', to: '', output: '6' }); // 0*1 + 1*2 + 1*4 = 6
  transitions.push({ from: '10', input: '0', to: '', output: '1' }); // 1*1 + 0*2 + 0*4 = 1
  transitions.push({ from: '10', input: '1', to: '', output: '5' }); // 1*1 + 0*2 + 1*4 = 5
  transitions.push({ from: '11', input: '0', to: '', output: '3' }); // 1*1 + 1*2 + 0*4 = 3
  transitions.push({ from: '11', input: '1', to: '', output: '7' }); // 1*1 + 1*2 + 1*4 = 7
  
  // Final output: flush partial group (pad high bits with zeros)
  // State "X" means bit0=X; padding gives bit0=X, bit1=0, bit2=0 -> value = X*1
  // State "XY" means bit0=X, bit1=Y; padding gives bit0=X, bit1=Y, bit2=0 -> value = X*1 + Y*2
  finalOutput[''] = '';
  finalOutput['0'] = '0'; // bit0='0' -> value 0*1 = 0
  finalOutput['1'] = '1'; // bit0='1' -> value 1*1 = 1
  finalOutput['00'] = '0'; // bit0='0', bit1='0' -> value 0*1 + 0*2 = 0
  finalOutput['01'] = '2'; // bit0='0', bit1='1' -> value 0*1 + 1*2 = 2
  finalOutput['10'] = '1'; // bit0='1', bit1='0' -> value 1*1 + 0*2 = 1
  finalOutput['11'] = '3'; // bit0='1', bit1='1' -> value 1*1 + 1*2 = 3
  
  return {
    states,
    inputAlphabet: ['0', '1'],
    outputAlphabet: ['0', '1', '2', '3', '4', '5', '6', '7'],
    start: '',
    transitions,
    finalOutput,
  };
}

/**
 * Build binary to hexadecimal transducer (LSB first)
 * 
 * State naming: bits stored in order they were read (LSB first)
 * E.g., if we read bits 0, then 1, then 0, the state is "010"
 * 
 * States: 15 total
 * - '' (empty)
 * - '0', '1' (1 bit)
 * - '00', '01', '10', '11' (2 bits)
 * - '000', '001', '010', '011', '100', '101', '110', '111' (3 bits)
 */
export function buildBinaryToHexTransducer(): Transducer {
  const states: StateId[] = [
    '',
    '0', '1',
    '00', '01', '10', '11',
    '000', '001', '010', '011', '100', '101', '110', '111',
  ];
  const transitions: TransducerTransition[] = [];
  const finalOutput: Record<StateId, string> = {};
  
  // From empty
  transitions.push({ from: '', input: '0', to: '0', output: '' });
  transitions.push({ from: '', input: '1', to: '1', output: '' });
  
  // From 1-bit to 2-bit: append new bit
  transitions.push({ from: '0', input: '0', to: '00', output: '' });
  transitions.push({ from: '0', input: '1', to: '01', output: '' });
  transitions.push({ from: '1', input: '0', to: '10', output: '' });
  transitions.push({ from: '1', input: '1', to: '11', output: '' });
  
  // From 2-bit to 3-bit: append new bit
  transitions.push({ from: '00', input: '0', to: '000', output: '' });
  transitions.push({ from: '00', input: '1', to: '001', output: '' });
  transitions.push({ from: '01', input: '0', to: '010', output: '' });
  transitions.push({ from: '01', input: '1', to: '011', output: '' });
  transitions.push({ from: '10', input: '0', to: '100', output: '' });
  transitions.push({ from: '10', input: '1', to: '101', output: '' });
  transitions.push({ from: '11', input: '0', to: '110', output: '' });
  transitions.push({ from: '11', input: '1', to: '111', output: '' });
  
  // From 3-bit: emit hex digit and go to empty
  // State "WXYZ..." represents bits bit0=W, bit1=X, bit2=Y, bit3=Z
  // Value = W*1 + X*2 + Y*4 + Z*8
  const hexDigits = '0123456789ABCDEF';
  const threeBitStates = ['000', '001', '010', '011', '100', '101', '110', '111'];
  
  for (const state of threeBitStates) {
    const bit0 = parseInt(state[0]!);
    const bit1 = parseInt(state[1]!);
    const bit2 = parseInt(state[2]!);
    const valueSoFar = bit0 + bit1 * 2 + bit2 * 4;
    
    for (const bit of ['0', '1']) {
      const bit3 = parseInt(bit);
      const value = valueSoFar + bit3 * 8;
      transitions.push({ from: state, input: bit, to: '', output: hexDigits[value]! });
    }
  }
  
  // Final output for partial groups
  // Pad high bits with zeros
  // State[i] = biti, value = bit0*1 + bit1*2 + bit2*4
  finalOutput[''] = '';
  finalOutput['0'] = '0'; // bit0='0' -> value 0
  finalOutput['1'] = '1'; // bit0='1' -> value 1
  finalOutput['00'] = '0'; // bit0='0', bit1='0' -> value 0
  finalOutput['01'] = '2'; // bit0='0', bit1='1' -> value 2
  finalOutput['10'] = '1'; // bit0='1', bit1='0' -> value 1
  finalOutput['11'] = '3'; // bit0='1', bit1='1' -> value 3
  finalOutput['000'] = '0'; // bit0='0', bit1='0', bit2='0' -> value 0
  finalOutput['001'] = '4'; // bit0='0', bit1='0', bit2='1' -> value 4
  finalOutput['010'] = '2'; // bit0='0', bit1='1', bit2='0' -> value 2
  finalOutput['011'] = '6'; // bit0='0', bit1='1', bit2='1' -> value 6
  finalOutput['100'] = '1'; // bit0='1', bit1='0', bit2='0' -> value 1
  finalOutput['101'] = '5'; // bit0='1', bit1='0', bit2='1' -> value 5
  finalOutput['110'] = '3'; // bit0='1', bit1='1', bit2='0' -> value 3
  finalOutput['111'] = '7'; // bit0='1', bit1='1', bit2='1' -> value 7
  
  return {
    states,
    inputAlphabet: ['0', '1'],
    outputAlphabet: hexDigits.split(''),
    start: '',
    transitions,
    finalOutput,
  };
}

/**
 * Build octal to binary transducer (single state, direct conversion)
 */
export function buildOctalToBinaryTransducer(): Transducer {
  const transitions: TransducerTransition[] = [];
  
  for (let i = 0; i < 8; i++) {
    const octalDigit = i.toString();
    const binary = i.toString(2).padStart(3, '0');
    transitions.push({ from: 'q0', input: octalDigit, to: 'q0', output: binary });
  }
  
  return {
    states: ['q0'],
    inputAlphabet: ['0', '1', '2', '3', '4', '5', '6', '7'],
    outputAlphabet: ['0', '1'],
    start: 'q0',
    transitions,
    finalOutput: { q0: '' },
  };
}

/**
 * Build hex to binary transducer (single state, direct conversion)
 */
export function buildHexToBinaryTransducer(): Transducer {
  const transitions: TransducerTransition[] = [];
  const hexDigits = '0123456789ABCDEFabcdef';
  
  for (const hex of hexDigits) {
    const value = parseInt(hex, 16);
    const binary = value.toString(2).padStart(4, '0');
    transitions.push({ from: 'q0', input: hex, to: 'q0', output: binary });
  }
  
  return {
    states: ['q0'],
    inputAlphabet: hexDigits.split(''),
    outputAlphabet: ['0', '1'],
    start: 'q0',
    transitions,
    finalOutput: { q0: '' },
  };
}
