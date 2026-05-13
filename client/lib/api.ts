const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export async function uploadReceipt(file: File, token: string) {
  const formData = new FormData();
  formData.append("receipt", file);

  const response = await fetch(`${apiUrl}/api/uploads/receipt`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Upload failed" }));
    throw new Error(error.message || "Upload failed");
  }

  return response.json() as Promise<{ receiptKey: string; receiptUrl: string }>;
}
