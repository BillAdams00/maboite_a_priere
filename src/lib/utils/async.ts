/**
 * Exécute une promesse avec un délai maximal (timeout de 15 secondes par défaut).
 * Si la promesse ne se résout pas avant le délai imparti, une erreur explicite est levée.
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs = 15000,
  timeoutMessage = 'Le serveur met trop de temps à répondre (délai de 15 s dépassé). Veuillez vérifier votre connexion et réessayer.'
): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(timeoutMessage));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timer!);
  }
}
