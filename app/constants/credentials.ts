type Environment = "development" | "staging" | "production";

export interface ICredentials {
  environment: Environment;
  clientId: string;
  redirectUri: string;
  wsServer: string;
}

let creds: ICredentials;

const urls = {
  development: "http://localhost:4444/",
  staging: "http://hs.itch.ovh/",
  production: "https://h.itch.ovh/",
};

function websocketize(url: string): string {
  return url.replace(/https?:/, "ws:") + "ws";
}

if (window.location.hostname === "localhost") {
  creds = {
    environment: "development",
    clientId: "d73862fdd9c78f030e785445941ff460",
    redirectUri: urls.development,
    wsServer: websocketize(urls.development),
  };
} else if (window.location.hostname === "hs.itch.ovh") {
  creds = {
    environment: "staging",
    clientId: "ba4f60730aa11a3c8567c92b929bc36d",
    redirectUri: urls.staging,
    wsServer: websocketize(urls.staging),
  };
} else {
  creds = {
    environment: "production",
    clientId: "95ca4668f14a930dfb712d724fc48487",
    redirectUri: urls.production,
    wsServer: websocketize(urls.production),
  };
}

export const RequiredScopes = ["profile:me"];

export default creds;
