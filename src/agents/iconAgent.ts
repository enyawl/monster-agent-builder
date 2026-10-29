// SERVER ONLY. The "icon agent": makes a picture for a new monster in the same style, so the user does not have to.
// =====================  MUSE: FILL IN  =====================
// Needs an IMAGE-generating model (ask the hackathon staff whether Muse or another allowed model can make images).
// Prompt idea: "Cute 3D soft white round mascot, same style as the reference, transparent background, wearing <outfit for the job>".
// Return a data URL or a stored image address. Until it is connected, the screen shows the placeholder picture.
// ===========================================================
export async function generateIcon(_job: string): Promise<{ ok: boolean; message: string; imageUrl?: string }> {
  return { ok: false, message: "The icon agent is not connected yet. See src/agents/iconAgent.ts." };
}
