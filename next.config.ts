import type { NextConfig } from 'next';

const config: NextConfig = {
  reactStrictMode: true,

  experimental: {
    /**
     * Alleen voor statische routes. Voor dynamische stond hier dertig seconden,
     * om het heen-en-weer tussen tabbladen direct te maken. Dat is teruggedraaid:
     * na het vastleggen van een gedronken fles stuurt de actie je terug naar de
     * kelder, en daar kwam je net vandaan — dus stond dat scherm in die cache en
     * zag je nog de oude voorraad. Een verkeerd aantal flessen is erger dan een
     * scherm dat een tel moet nadenken.
     *
     * De winst van #11 blijft overeind: twee netwerkritjes minder per scherm, en
     * de tabbladen halen hun scherm nog steeds alvast op.
     */
    staleTimes: { static: 180 },
  },
};

export default config;
