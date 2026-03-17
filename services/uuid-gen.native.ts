// Powered by OnSpace.AI — Native UUID generation
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

export function generateUUID(): string {
  return uuidv4();
}
