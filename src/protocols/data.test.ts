import protocols, {Protocol} from "./data";
import { baseIconsUrl } from "../constants";
import { normalizeChain } from "../utils/normalizeChain";
const fs = require("fs");

async function importProtocol(protocol:Protocol){
  if(protocol.name.startsWith('Karura ')){
    return {}
  } else {
    return import(`../../DefiLlama-Adapters/projects/${protocol.module}`);
  }
}

test("all the dynamic imports work", async () => {
  for (const protocol of protocols) {
    await importProtocol(protocol)
  }
});

test("all the chains on the adapter are listed on the protocol", async () => {
  for (const protocol of protocols) {
    const module = await importProtocol(protocol)
    const chains = protocol.chains.map((chain) => normalizeChain(chain));
    Object.keys(module).forEach((key) => {
      if (
        key !== "fetch" &&
        key !== "tvl" &&
        key !== "staking" &&
        key !== "pool2" &&
        key !== "treasury" &&
        key !== "default" &&
        typeof module[key] === "object" &&
        module[key] !== null
      ) {
        if (!chains.includes(key)) {
          throw new Error(`${protocol.name} doesn't include chain ${key}`);
        }
      }
    });
  }
});

test("projects have a single chain or each chain has an adapter", async () => {
  for (const protocol of protocols) {
    const module = await importProtocol(protocol)
    const chains = protocol.chains.map((chain) => normalizeChain(chain));
    if (chains.length > 1) {
      chains.forEach((chain) => {
        if (module[chain] === undefined) {
          throw new Error(
            `Protocol "${protocol.name}" doesn't have chain "${chain}" on their module`
          );
        }
      });
    }
  }
});

test("no id is repeated", async () => {
  const ids = [];
  for (const protocol of protocols) {
    expect(ids).not.toContain(protocol.id);
    ids.push(protocol.id);
  }
});

test("icon exists", async () => {
  for (const protocol of protocols) {
    const icon = protocol.logo?.substr(baseIconsUrl.length + 1);
    if (icon !== undefined) {
      const path = `./icons/${icon}`;
      if (!fs.existsSync(path)) {
        throw new Error(`Icon ${path} doesn't exist`);
      }
    }
  }
});
