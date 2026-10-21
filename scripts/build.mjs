import fs from "node:fs";
fs.rmSync(new URL("../dist", import.meta.url), {
  recursive: true,
  force: true,
});
fs.mkdirSync(new URL("../dist", import.meta.url));
for (const name of fs.readdirSync(new URL("../src", import.meta.url)))
  fs.copyFileSync(
    new URL("../src/" + name, import.meta.url),
    new URL("../dist/" + name, import.meta.url),
  );
for (const name of ["index", "models"])
  fs.writeFileSync(
    new URL("../dist/" + name + ".d.cts", import.meta.url),
    fs
      .readFileSync(
        new URL("../src/" + name + ".d.ts", import.meta.url),
        "utf8",
      )
      .replaceAll("./models.js", "./models.cjs"),
  );
