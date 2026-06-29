/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MAPBOX_ACCESS_TOKEN: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "mapbox-gl/dist/mapbox-gl-csp-worker?worker" {
  const WorkerFactory: new () => Worker;
  export default WorkerFactory;
}
