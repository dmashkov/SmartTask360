/**
 * SmartTask360 — Documents hooks
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTaskDocuments, uploadDocument, deleteDocument, getDocumentDownloadUrl } from "../api";

export function useTaskDocuments(taskId: string) {
  return useQuery({
    queryKey: ["documents", taskId],
    queryFn: () => getTaskDocuments(taskId),
    enabled: !!taskId,
  });
}

export function useUploadDocument(taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, description }: { file: File; description?: string }) =>
      uploadDocument(taskId, file, description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents", taskId] });
    },
  });
}

export function useDeleteDocument(taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (documentId: string) => deleteDocument(documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents", taskId] });
    },
  });
}

export function useDownloadDocument() {
  return useMutation({
    mutationFn: async (documentId: string) => {
      const url = await getDocumentDownloadUrl(documentId);
      // Open download in new tab
      window.open(url, "_blank");
      return url;
    },
  });
}
