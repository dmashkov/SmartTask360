/**
 * SmartTask360 — AI Module
 *
 * Provides AI-powered task validation and assistance.
 */

// Types
export type {
  SMARTCriterion,
  AcceptanceCriterion,
  SMARTValidationResult,
  SMARTValidationResponse,
  SMARTValidationRequest,
  InlineSMARTValidationRequest,
  AIMessage,
  AIConversation,
  AIConversationWithMessages,
  DialogType,
  StartDialogRequest,
  StartDialogResponse,
  SendMessageRequest,
  SendMessageResponse,
} from "./types";

// API
export {
  validateTaskSMART,
  getTaskSMARTValidations,
  applySMARTSuggestions,
  getConversation,
  getConversationWithMessages,
  startDialog,
  sendMessage,
  deleteConversation,
  getTaskConversations,
} from "./api";

// Hooks
export {
  useValidateSMART,
  useTaskSMARTValidations,
  useApplySMARTSuggestions,
  useConversation,
  useConversationWithMessages,
  useStartDialog,
  useSendMessage,
  useDeleteConversation,
  useTaskConversations,
} from "./hooks";

// Components
export { SMARTValidationCard, SMARTValidationButton, AITab } from "./components";
