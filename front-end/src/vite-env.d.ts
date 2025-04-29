/// <reference types="vite/client" />

interface ViteTypeOptions {
    // By adding this line, you can make the type of ImportMetaEnv strict
    // to disallow unknown keys.
    // strictImportMetaEnv: unknown
}

interface ImportMetaEnv {
    readonly VITE_SERVER_URL: String;
    readonly VITE_SERVER_PORT: String;
    readonly VITE_UPLOAD_API: String;
    readonly VITE_SERVER_SOCKET:String;
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}