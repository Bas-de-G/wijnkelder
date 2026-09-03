import type { NextConfig } from 'next';

const config: NextConfig = {
  reactStrictMode: true,

  experimental: {
    /**
     * Hoe lang de router een al bezocht scherm clientside vasthoudt. Standaard
     * is dat nul voor dynamische pagina's, en dus haalt elk tabblad zijn
     * gegevens opnieuw op — ook als je net terugtikt naar waar je vandaan komt.
     *
     * Dertig seconden is lang genoeg om het heen-en-weer tussen tabbladen
     * direct te maken, en kort genoeg om niet in de weg te zitten. Schrijven
     * gaat via server actions die revalidatePath aanroepen, en dat leegt deze
     * cache meteen — een toegevoegde wijn staat er dus gewoon.
     */
    staleTimes: { dynamic: 30, static: 180 },
  },
};

export default config;
