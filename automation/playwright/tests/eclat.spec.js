const s = require("../support/site");
const {
  test,
  expect,
  go,
  home,
  reader,
  comfort,
  adultForm,
  childForm,
  createLoan,
  exportBackup,
  importBackup,
  backup,
  book,
  audioFixture,
  playing,
  stopped,
} = s;
const catalog = require("../squash-cases.json");
const checks = new Map();
const add = (id, fn) => checks.set(id, fn);
const text = (p, id) => p.locator("#" + id);
const png = {
  name: "test.png",
  mimeType: "image/png",
  buffer: Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a9AAAAABJRU5ErkJggg==",
    "base64",
  ),
};
const routes = [
  ["/", "Éclat"],
  ["/emprunts.html", "Emprunt"],
  ["/emprunts-enfants.html", "livres"],
  ["/migration.html", "Éclat"],
  ["/narration-credits.html", "Éclat"],
];
add(2, async ({ page }) => {
  await home(page);
  await text(page, "libraryLoansLink").click();
  await expect(page).toHaveURL(/emprunts\.html$/);
  await page.getByRole("link", { name: /Retour à l’Accueil/ }).click();
  await expect(text(page, "adultBtn")).toBeVisible();
  await text(page, "childBtn").click();
  await text(page, "libraryLoansLink").click();
  await expect(page).toHaveURL(/emprunts-enfants\.html$/);
  await page.getByRole("link", { name: /Retour à l’Accueil/ }).click();
  await expect(page.locator("body")).toHaveClass(/kids/);
  for (const path of ["/migration.html"]) {
    await go(page, path);
    const link = page.getByRole("link", { name: /accueil/i }).first();
    await expect(link).toBeVisible();
    await link.click();
    await expect(text(page, "adultBtn")).toBeVisible();
  }
});
add(3, async ({ page }) => {
  // Assert the routes specified in the imported cases, including extensionless routes.
  const expected = [
    ["/", "#adultBtn"],
    ["/emprunts", "#loansOverview"],
    ["/emprunts-enfants", "#bookOverview"],
    ["/migration", "#exportData"],
    ["/narration-credits", "h1"],
  ];
  for (const [path, selector] of expected) {
    await go(page, path);
    await expect(page.locator(selector)).toBeVisible();
    if (path === "/narration-credits")
      await expect(page.locator("h1")).toContainText(/voix/i);
    const r = await page.reload();
    expect(r.status()).toBe(200);
    await expect(page.locator(selector)).toBeVisible();
  }
});
add(4, async ({ page }) => {
  await home(page, "child");
  await expect(page.locator("body")).toHaveClass(/kids/);
  await expect(text(page, "shuffleLabel")).toContainText("Surprends-moi");
  await expect(text(page, "bedtimeStory")).toBeVisible();
  await expect(text(page, "libraryLoansLink")).toHaveAttribute(
    "href",
    "/emprunts-enfants.html",
  );
});
add(5, async ({ page }) => {
  await home(page, "child");
  await text(page, "adultBtn").click();
  await expect(page.locator("body")).not.toHaveClass(/kids/);
  await expect(text(page, "continuousListen")).toBeVisible();
  await expect(text(page, "bedtimeStory")).toBeHidden();
  await expect(text(page, "libraryLoansLink")).toHaveAttribute(
    "href",
    "/emprunts.html",
  );
});
add(6, async ({ page }) => {
  await go(page, "/emprunts-enfants.html");
  await page.getByRole("link", { name: /Retour à l’Accueil/ }).click();
  await expect(page).toHaveURL(/public=enfants/);
  await expect(page.locator("body")).toHaveClass(/kids/);
  await page.reload();
  await expect(page.locator("body")).toHaveClass(/kids/);
});
add(7, async ({ page }) => {
  await home(page);
  for (const publicId of ["adultBtn", "childBtn"]) {
    await text(page, publicId).click();
    for (let i = 0; i < 6; i++) {
      await page.locator("#moodGrid button").nth(i).click();
      await expect(text(page, "readerText")).not.toHaveText("");
      await expect(text(page, "readerAuthor")).not.toHaveText("");
      await expect(text(page, "readerWork")).not.toHaveText("");
      await expect(text(page, "readerSource")).toHaveAttribute(
        "href",
        /^https:\/\//,
      );
      expect(
        (await page.evaluate(() => window.eclatCurrentPassage)).audience,
      ).toBe(publicId === "adultBtn" ? "adult" : "child");
      await text(page, "readerClose").click();
    }
  }
});
add(8, async ({ page }) => {
  await home(page);
  for (const publicId of ["adultBtn", "childBtn"]) {
    await text(page, publicId).click();
    for (let i = 0; i < 10; i++) {
      await text(page, "shuffleBtn").click();
      await expect(page.locator("#moodGrid button")).toHaveCount(6);
      await page.locator("#moodGrid button").first().click();
      await expect(text(page, "readerText")).not.toHaveText("");
      expect(
        (await page.evaluate(() => window.eclatCurrentPassage)).audience,
      ).toBe(publicId === "adultBtn" ? "adult" : "child");
      await text(page, "readerClose").click();
    }
  }
});
add(9, async ({ page }) => {
  for (const audience of ["adult", "child"]) {
    const p = await reader(page, audience);
    expect(p.author).toBeTruthy();
    expect(p.workTitle).toBeTruthy();
    await expect(text(page, "readerAuthor")).toContainText(p.author);
    await expect(text(page, "readerWork")).toContainText(p.workTitle);
    await expect(text(page, "readerSource")).toHaveAttribute("href", p.source);
    await expect(text(page, "readerYear")).not.toHaveText("");
  }
});
async function setupPassage(page, kind) {
  await home(page);
  return page.evaluate((k) => {
    const candidates = PASSAGES.filter((p) => p.audience === "adult");
    const p = candidates.find((p) =>
      candidates.some(
        (q) =>
          q.id !== p.id &&
          (k === "work" ? q.workTitle === p.workTitle : q.author === p.author),
      ),
    );
    if (!p) throw new Error("Fixture de passages insuffisante");
    directPassage(p, "Fixture de test");
    return p;
  }, kind);
}
add(12, async ({ page }) => {
  const before = await setupPassage(page, "work");
  await text(page, "sameWork").click();
  const after = await page.evaluate(() => window.eclatCurrentPassage);
  expect(after.workTitle).toBe(before.workTitle);
  expect(after.id).not.toBe(before.id);
  await expect(text(page, "readerText")).not.toHaveText("");
});
add(14, async ({ page }) => {
  const before = await setupPassage(page, "author");
  await text(page, "sameAuthor").click();
  expect((await page.evaluate(() => window.eclatCurrentPassage)).author).toBe(
    before.author,
  );
  await expect(text(page, "readerText")).not.toHaveText("");
});
add(15, async ({ page }) => {
  await home(page);
  const before = await page.evaluate(() => {
    const p = PASSAGES.find(
      (p) =>
        p.audience === "adult" &&
        new Set(
          PASSAGES.filter((q) => q.author === p.author).map((q) => q.workTitle),
        ).size === 1,
    );
    if (!p)
      throw new Error(
        "BLOQUÉ : aucun auteur à œuvre unique dans le catalogue de test",
      );
    directPassage(p, "Auteur à œuvre unique");
    return p;
  });
  await text(page, "sameAuthor").click();
  const after = await page.evaluate(() => window.eclatCurrentPassage);
  expect(after.author).toBe(before.author);
  await expect(text(page, "readerText")).not.toHaveText("");
});
add(16, async ({ page }) => {
  await audioFixture(page);
  await reader(page);
  await text(page, "listenToggle").click();
  await playing(page);
  const t = await page.evaluate(() => window.__media.at(-1).currentTime);
  await expect
    .poll(() => page.evaluate(() => window.__media.at(-1).currentTime))
    .toBeGreaterThan(t + 0.1);
  expect(
    await page.evaluate(() => window.__media.at(-1).duration),
  ).toBeGreaterThan(0);
  await expect(text(page, "readerText")).not.toHaveText("");
});
add(18, async ({ page }) => {
  await audioFixture(page);
  await reader(page);
  await stopped(page);
  expect(await page.evaluate(() => window.__media.length)).toBe(0);
});
add(19, async ({ page }) => {
  await audioFixture(page);
  await reader(page);
  await text(page, "listenToggle").click();
  await playing(page);
  await expect
    .poll(() => page.evaluate(() => window.__media.at(-1).currentTime))
    .toBeGreaterThan(0.1);
  await text(page, "listenToggle").click();
  await stopped(page);
  const t = await page.evaluate(() => window.__media.at(-1).currentTime);
  await expect
    .poll(() => page.evaluate(() => window.__media.at(-1).paused))
    .toBe(true);
  expect(
    await page.evaluate(() => window.__media.at(-1).currentTime),
  ).toBeCloseTo(t, 2);
  await text(page, "listenToggle").click();
  await playing(page);
  await expect
    .poll(() => page.evaluate(() => window.__media.at(-1).currentTime))
    .toBeGreaterThan(t);
});
add(20, async ({ page }) => {
  await audioFixture(page);
  await reader(page);
  await text(page, "listenToggle").click();
  await playing(page);
  await text(page, "listenStop").click();
  await stopped(page);
  await text(page, "listenToggle").click();
  await playing(page);
});
add(21, async ({ page }) => {
  await audioFixture(page);
  await reader(page);
  await text(page, "listenToggle").click();
  await playing(page);
  await text(page, "readerClose").click();
  await stopped(page);
  await page.locator("#moodGrid button").nth(1).click();
  await stopped(page);
  await text(page, "listenToggle").click();
  await playing(page);
});
add(22, async ({ page }) => {
  for (const audience of ["adult", "child"]) {
    await reader(page, audience);
    await expect(
      page.locator(".child-narrator [data-kind=female]"),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator(".child-narrator [data-kind=female]")).toHaveText(
      audience === "adult" ? "Narratrice" : "Conteuse",
    );
  }
});
add(23, async ({ page }) => {
  await audioFixture(page);
  const p = await reader(page);
  const urls = [];
  for (const kind of ["female", "male"]) {
    await page.locator(".child-narrator [data-kind=" + kind + "]").click();
    if (kind === "female") await text(page, "listenToggle").click();
    await playing(page);
    urls.push(await page.evaluate(() => window.__media.at(-1).src));
    expect((await page.evaluate(() => window.eclatCurrentPassage)).id).toBe(
      p.id,
    );
  }
  expect(urls[0]).not.toBe(urls[1]);
});
add(24, async ({ page }) => {
  await audioFixture(page);
  const p = await reader(page);
  await text(page, "listenToggle").click();
  await playing(page);
  await page.locator(".child-narrator [data-kind=male]").click();
  await playing(page);
  await expect
    .poll(() => page.evaluate(() => window.__media.at(-1).src))
    .toMatch(/\/male\.wav$/);
  expect((await page.evaluate(() => window.eclatCurrentPassage)).id).toBe(p.id);
  expect(
    await page.evaluate(() => window.__media.filter((a) => !a.paused).length),
  ).toBe(1);
});
add(25, async ({ page }) => {
  await audioFixture(page, "ok", 1.2);
  await home(page);
  await text(page, "continuousListen").click();
  await playing(page);
  const p = await page.evaluate(() => window.eclatCurrentPassage);
  // Let a short real media reach its natural end. Seeking an intercepted WAV
  // without HTTP range support is not a reliable way to trigger ended.
  await expect
    .poll(() => page.evaluate(() => window.eclatCurrentPassage.id))
    .not.toBe(p.id);
  await playing(page);
  expect((await page.evaluate(() => window.eclatCurrentPassage)).audience).toBe(
    "adult",
  );
});
add(26, async ({ page }) => {
  await audioFixture(page);
  await home(page);
  await text(page, "continuousListen").click();
  await playing(page);
  // Continuous listening runs on the home page, without opening the reader.
  await text(page, "continuousListen").click();
  await stopped(page);
  await expect(text(page, "continuousListen")).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  const id = await page.evaluate(() => window.eclatCurrentPassage.id);
  await page.evaluate(() =>
    window.__media.at(-1).dispatchEvent(new Event("ended")),
  );
  expect((await page.evaluate(() => window.eclatCurrentPassage)).id).toBe(id);
  await stopped(page);
});
add(27, async ({ page }) => {
  await audioFixture(page);
  await home(page, "child");
  await text(page, "bedtimeStory").click();
  await expect(text(page, "bedtimeStory")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await playing(page);
  expect((await page.evaluate(() => window.eclatCurrentPassage)).audience).toBe(
    "child",
  );
  await expect(
    page.locator(".child-narrator [data-kind=female]"),
  ).toHaveAttribute("aria-pressed", "true");
});
add(28, async ({ page }) => {
  await audioFixture(page, "ok", 1.2);
  await home(page, "child");
  await text(page, "bedtimeStory").click();
  await playing(page);
  const first = await page.evaluate(() => window.eclatCurrentPassage.id);
  await expect.poll(() => page.evaluate(() => window.eclatCurrentPassage.id)).not.toBe(first);
  await playing(page);
  await text(page, "bedtimeStory").click();
  await stopped(page);
  await expect(text(page, "bedtimeStory")).toHaveAttribute("aria-pressed", "false");
  const last=await page.evaluate(() => window.eclatCurrentPassage.id);
  await page.waitForTimeout(2500);
  expect(await page.evaluate(() => window.eclatCurrentPassage.id)).toBe(last);
  await stopped(page);
});
add(29, async ({ page }) => {
  await audioFixture(page, "error");
  await reader(page);
  await text(page, "listenToggle").click();
  await expect(text(page, "listenStatus")).toContainText("indisponible");
  await expect(text(page, "readerText")).not.toHaveText("");
  await expect(text(page, "listenToggle")).toBeEnabled();
  await stopped(page);
});
add(30, async ({ page }) => {
  const release = await audioFixture(page, "slow");
  await reader(page);
  await text(page, "listenToggle").click();
  await expect(text(page, "listenStatus")).toContainText("prépare");
  await text(page, "listenStop").click();
  await stopped(page);
  await text(page, "listenToggle").click();
  release();
  await playing(page);
});
add(32, async ({ page }) => {
  const p = await reader(page);
  await text(page, "saveExcerpt").click();
  await text(page, "readerClose").click();
  await expect(text(page, "savedCount")).toHaveText("1");
  await text(page, "savedOpen").click();
  await expect(page.locator("#savedList .saved-item")).toHaveCount(1);
  await page.locator("#savedList .saved-item").click();
  expect((await page.evaluate(() => window.eclatCurrentPassage)).id).toBe(p.id);
});
add(33, async ({ page }) => {
  const p = await reader(page);
  await text(page, "saveExcerpt").click();
  await page.reload();
  await expect(text(page, "savedCount")).toHaveText("1");
  await text(page, "savedOpen").click();
  await expect(page.locator("#savedList .saved-item")).toHaveAttribute(
    "data-id",
    p.id,
  );
});
add(34, async ({ page }) => {
  await reader(page);
  await text(page, "saveExcerpt").click();
  await text(page, "saveExcerpt").click();
  await page.reload();
  await expect(text(page, "savedCount")).toHaveText("0");
  await text(page, "savedOpen").click();
  await expect(page.locator("#savedList .saved-item")).toHaveCount(0);
});
add(36, async ({ page }) => {
  await home(page);
  const measure = () =>
    text(page, "heroCopy").evaluate((e) => {
      const s = getComputedStyle(e);
      return {
        line: parseFloat(s.lineHeight),
        space: parseFloat(s.letterSpacing) || 0,
        text: e.textContent,
      };
    });
  const before = await measure();
  await comfort(page);
  await page.locator("[data-setting=spacing]").check();
  const after = await measure();
  expect(after.text).toBe(before.text);
  expect(after.line > before.line || after.space > before.space).toBe(true);
});
add(37, async ({ page }) => {
  await home(page);
  await comfort(page);
  await text(page, "comfort-size").selectOption("150");
  for (const path of ["/", "/emprunts.html", "/emprunts-enfants.html"]) {
    await go(page, path);
    await page.reload();
    await comfort(page);
    await expect(text(page, "comfort-size")).toHaveValue("150");
    expect(
      await page
        .locator("html")
        .evaluate((e) =>
          getComputedStyle(e).getPropertyValue("--comfort-scale").trim(),
        ),
    ).toBe("1.5");
  }
});
add(39, async ({ page }) => {
  await home(page);
  await comfort(page);
  await page.locator("[data-setting=simple]").check();
  await page.locator("[data-close]").click();
  await expect(text(page, "libraryNearby")).toBeVisible();
  await expect(page.locator("#moodGrid button")).toHaveCount(6);
  await page.locator("#moodGrid button").first().click();
  await expect(text(page, "readerText")).not.toHaveText("");
  await expect(text(page, "listenToggle")).toBeVisible();
  await text(page, "readerClose").click();
  await expect(text(page, "libraryLoansLink")).toBeVisible();
});
add(42, async ({ page }) => {
  await page.addInitScript(() => {
    window.__speech = [];
    window.SpeechSynthesisUtterance = class {
      constructor(text) {
        this.text = text;
      }
    };
    Object.defineProperty(window, "speechSynthesis", {
      value: {
        cancel() {},
        getVoices() {
          return [];
        },
        speak(u) {
          window.__speech.push({ rate: u.rate, text: u.text });
        },
        pause() {},
        resume() {},
        addEventListener() {},
      },
    });
  });
  await home(page);
  await comfort(page);
  for (const rate of ["0.85", "1", "1.15"]) {
    await text(page, "comfort-rate").selectOption(rate);
    await page.locator("[data-speak]").click();
    expect(await page.evaluate(() => window.__speech.at(-1).rate)).toBe(
      Number(rate),
    );
    expect(
      await page.evaluate(() => window.__speech.at(-1).text.length),
    ).toBeGreaterThan(0);
  }
});
add(43, async ({ page }) => {
  await childForm(page);
  await text(page, "bookTitle").fill("Livre conservé");
  await text(page, "bookAuthor").fill("Auteur test");
  await text(page, "saveBook").click();
  await comfort(page);
  await text(page, "comfort-size").selectOption("200");
  await text(page, "comfort-theme").selectOption("dark");
  await page.locator("[data-setting=spacing]").check();
  await page.locator("[data-reset]").click();
  await page.reload();
  await expect(text(page, "savedBooks")).toContainText("Livre conservé");
  await comfort(page);
  await expect(text(page, "comfort-size")).toHaveValue("100");
  await expect(text(page, "comfort-theme")).toHaveValue("paper");
  await expect(page.locator("[data-setting=spacing]")).not.toBeChecked();
});
async function libraries(page, mode = "ok") {
  // V73 queries the same-origin backend. The backend, not the browser,
  // downloads the national dataset, so intercept that API boundary.
  await page.route("**/api/bibliotheques?**", (r) => {
    const cp = new URL(r.request().url()).searchParams.get("cp");
    const results =
      cp === "75001"
        ? [
            {
              name: "Bibliothèque A",
              address: "Rue A",
              postalCode: cp,
              city: "Paris",
              website: "https://example.org/a",
            },
            {
              name: "Bibliothèque B",
              address: "Rue B",
              postalCode: cp,
              city: "Paris",
              website: "https://example.org/b",
            },
          ]
        : [];
    return r.fulfill(
      mode === "error"
        ? { status: 503, json: { error: "Fixture indisponible" } }
        : { json: { postalCode: cp, count: results.length, results } },
    );
  });
  await home(page);
  await text(page, "libraryNearby").click();
  await expect(text(page, "libraryPostal")).toBeVisible();
}
add(44, async ({ page }) => {
  await libraries(page);
  await text(page, "libraryPostal").fill("75001");
  await text(page, "librarySearchButton").click();
  await expect(page.locator(".library-result")).toHaveCount(2);
  await expect(text(page, "libraryInlineResults")).toContainText(
    "Bibliothèque A",
  );
  await expect(page.locator(".library-result a").first()).toHaveAttribute(
    "href",
    "https://example.org/a",
  );
});
add(45, async ({ page }) => {
  let requests = 0;
  page.on("request", (r) => {
    if (
      r.url().includes("/api/bibliotheques") ||
      r.url().includes("data.gouv.fr")
    )
      requests++;
  });
  await home(page);
  await text(page, "libraryNearby").click();
  for (const value of ["", "abcde", "123"]) {
    await text(page, "libraryPostal").fill(value);
    await text(page, "librarySearchButton").click();
    await expect(text(page, "libraryStatus")).toContainText("5 chiffres");
  }
  expect(requests).toBe(0);
});
add(46, async ({ page }) => {
  await libraries(page);
  await text(page, "libraryPostal").fill("99999");
  await text(page, "librarySearchButton").click();
  await expect(text(page, "libraryInlineResults")).toContainText(
    /Aucun résultat|Aucun établissement/,
  );
  await text(page, "libraryPostal").fill("75001");
  await text(page, "librarySearchButton").click();
  await expect(page.locator(".library-result")).toHaveCount(2);
  await page.unroute("**/api/bibliotheques?**");
  await page.route("**/api/bibliotheques?**", (r) =>
    r.fulfill({ status: 503, json: { error: "Fixture indisponible" } }),
  );
  await page.evaluate(() => localStorage.removeItem("eclat_libraries_fr_v1"));
  await page.reload();
  await text(page, "libraryNearby").click();
  await text(page, "libraryPostal").fill("75001");
  await text(page, "librarySearchButton").click();
  await expect(text(page, "libraryInlineResults")).toContainText(
    "indisponible",
  );
  await expect(text(page, "librarySearchButton")).toBeEnabled();
});
add(47, async ({ page }) => {
  await home(page, "child");
  await text(page, "libraryNearby").click();
  await expect(text(page, "libraryChildView")).toBeVisible();
  await expect(text(page, "libraryAdultView")).toBeHidden();
  await text(page, "libraryPanelClose").click();
  await expect(text(page, "libraryPanel")).toHaveAttribute(
    "aria-hidden",
    "true",
  );
  await expect(page.locator("body")).toHaveClass(/kids/);
});
add(48, async ({ page, context }) => {
  await context.clearPermissions();
  await libraries(page);
  await text(page, "libraryPostal").fill("75001");
  await text(page, "librarySearchButton").click();
  await expect(page.locator(".library-result")).toHaveCount(2);
});
add(49, async ({ page }) => {
  await go(page, "/emprunts.html");
  await createLoan(page);
  const before = await text(page, "loansList").innerText();
  await text(page, "newLoan").click();
  await text(page, "borrowAgain").fill("Brouillon");
  await text(page, "cancelLoan").click();
  expect(await text(page, "loansList").innerText()).toBe(before);
  await expect(page.locator(".loan-row")).toHaveCount(1);
});
add(50, async ({ page }) => {
  await adultForm(page);
  await text(page, "saveButton").click();
  // Wait for either rejection or completed submission before checking the
  // outcome; otherwise the next check races the IndexedDB transaction.
  await page.waitForFunction(
    () => {
      const form = document.getElementById("loansForm");
      return (
        form.hidden ||
        !!form.querySelector(":invalid") ||
        document.getElementById("saveStatus").classList.contains("error")
      );
    },
    null,
    { timeout: 7000 },
  );
  await expect(
    text(page, "loansForm"),
    "Le formulaire vide a été accepté alors que ce cas exige son rejet. Confirmer les champs obligatoires avec la règle produit.",
  ).toBeVisible();
  await expect(page.locator(".loan-row")).toHaveCount(0);
  await expect(text(page, "loansForm")).toBeVisible();
  await text(page, "returnDate").fill("2020-01-01");
  await text(page, "saveButton").click();
  await expect(text(page, "saveStatus")).toContainText('photo');
  await expect(text(page, "loansForm")).toBeVisible();
  await text(page, "galleryPhoto").setInputFiles(png);
  await expect(page.locator('#photoList img')).toBeVisible();
  await text(page, "returnDate").fill("");
  await text(page, "saveButton").click();
  expect(
    await text(page, "returnDate").evaluate((e) => e.validity.valueMissing),
  ).toBe(true);
  await expect(page.locator(".loan-row")).toHaveCount(0);
});
add(51, async ({ page }) => {
  await adultForm(page);
  await text(page, "galleryPhoto").setInputFiles(png);
  await expect(page.locator("#photoList img")).toBeVisible();
  await text(page, "returnDate").fill("2030-01-15");
  await text(page, "borrowAgain").fill("Test A");
  await text(page, "reserveBooks").fill("Test B");
  await text(page, "saveButton").click();
  await expect(text(page, "loansForm")).toBeHidden();
  await expect(text(page, "overviewStatus")).toContainText("enregistré");
  await page.reload();
  await expect(page.locator(".loan-row")).toHaveCount(1);
  await expect(text(page, "loansList")).toContainText("15/01/2030");
  await expect(text(page, "loansList")).toContainText("Test A");
  await expect(text(page, "loansList")).toContainText("Test B");
  await expect
    .poll(() =>
      page
        .locator("#loansList img")
        .evaluate((e) => e.complete && e.naturalWidth > 0),
    )
    .toBe(true);
});
add(52, async ({ page }) => {
  await go(page, "/emprunts.html");
  await createLoan(page, "Livre A");
  await createLoan(page, "Livre B");
  const rows = page.locator(".loan-row");
  await rows
    .filter({ hasText: "Livre A" })
    .getByRole("button", { name: /Voir ou modifier/ })
    .click();
  await text(page, "borrowAgain").fill("Livre A modifié");
  await text(page, "returnDate").fill("2030-02-01");
  await text(page, "saveButton").click();
  await page.reload();
  await expect(rows).toHaveCount(2);
  await expect(rows.filter({ hasText: "Livre A modifié" })).toContainText(
    "01/02/2030",
  );
  await expect(rows.filter({ hasText: "Livre B" })).toContainText("15/01/2030");
});
add(53, async ({ page }) => {
  await go(page, "/emprunts.html");
  await createLoan(page, "Livre A");
  await createLoan(page, "Livre B");
  await page
    .locator(".loan-row")
    .filter({ hasText: "Livre A" })
    .getByRole("button", { name: "Livres rendus", exact: true })
    .click();
  await page.reload();
  await expect(
    page.locator(".loan-row").filter({ hasText: "Livre A" }),
  ).toContainText("Livres rendus le");
  await expect(
    page.locator(".loan-row").filter({ hasText: "Livre B" }),
  ).not.toContainText("Livres rendus le");
});
add(54, async ({ page }) => {
  await adultForm(page);
  await text(page, 'returnDate').fill('2030-01-15');
  await text(page, 'galleryPhoto').setInputFiles(png);
  await expect(page.locator('#photoList img')).toBeVisible();
  await text(page, "galleryPhoto").setInputFiles(png);
  await expect(page.locator("#photoList img")).toBeVisible();
  await text(page, "saveButton").click();
  await page.reload();
  await expect
    .poll(() =>
      page
        .locator("#loansList img")
        .evaluate((e) => e.complete && e.naturalWidth === 1),
    )
    .toBe(true);
  await childForm(page);
  await text(page, "galleryPhotos").setInputFiles(png);
  await expect(page.locator("#bookPhotos img")).toBeVisible();
  await text(page, "bookTitle").fill("Photo");
  await text(page, "bookAuthor").fill("Test");
  await text(page, "saveBook").click();
  await page.reload();
  await expect
    .poll(() =>
      page
        .locator("#savedBooks img")
        .evaluate((e) => e.complete && e.naturalWidth === 1),
    )
    .toBe(true);
});
add(57, async ({ page }) => {
  await adultForm(page);
  await text(page, 'returnDate').fill('2030-01-15');
  await text(page, 'galleryPhoto').setInputFiles(png);
  await expect(page.locator('#photoList img')).toBeVisible();
  await text(page, "returnDate").fill("2030-01-15");
  await text(page, "weeklyReminder").check();
  await text(page, "reminderTime").fill("09:30");
  await text(page, "saveButton").click();
  const href = await page
    .getByRole("link", { name: /Ajouter le rappel/ })
    .getAttribute("href");
  const login = new URL(href),
    calendar = new URL(login.searchParams.get("continue"));
  expect(calendar.hostname).toBe("calendar.google.com");
  expect(calendar.searchParams.get("dates")).toBe(
    "20300115T093000/20300115T094500",
  );
  expect(calendar.searchParams.get("ctz")).toBe("Europe/Paris");
  expect(calendar.searchParams.get("recur")).toBe("RRULE:FREQ=WEEKLY");
});
async function news(page, mode = "ok") {
  await page.route("**/api/library-news?**", (r) =>
    r.fulfill(
      mode === "error"
        ? { status: 502, json: { error: "Fixture indisponible" } }
        : mode === "invalid"
          ? { contentType: "text/plain", body: "not json" }
          : {
              json: {
                checkedAt: "2030-01-01T12:00:00Z",
                items: [
                  ...Array.from({ length: 20 }, (_, i) => ({
                    id: "book-" + i,
                    kind: "book",
                    title: "Livre fixture " + i,
                    url: "https://example.org/book/" + i,
                  })),
                  {
                    id: "news-1",
                    kind: "news",
                    title: "Actualité fixture",
                    url: "https://example.org/news",
                  },
                ],
              },
            },
    ),
  );
  await go(page, "/emprunts.html");
  await text(page, "libraryWatchOpen").click();
  await text(page, "libraryUrl").fill("https://example.org/library");
  await page.getByRole("button", { name: "Enregistrer et consulter" }).click();
}
add(60, async ({ page }) => {
  await news(page);
  await expect(
    page.locator("#libraryNewsResults .library-news-card"),
  ).toHaveCount(21);
  await expect(text(page, "libraryNewsResults")).toContainText(
    "Les nouveautés",
  );
  await expect(text(page, "libraryNewsResults")).toContainText(
    "Les actualités",
  );
  await expect(
    page
      .locator("#libraryNewsResults .library-item-kind")
      .filter({ hasText: "Livre" }),
  ).toHaveCount(20);
});
add(61, async ({ page }) => {
  let forbidden = 0;
  page.on("request", (r) => {
    if (/reservation|booking/i.test(r.url())) forbidden++;
  });
  await news(page);
  await page.locator("#libraryNewsResults .library-heart").first().click();
  await expect(text(page, "libraryWantedList")).toContainText(
    "Livre fixture 0",
  );
  await page.reload();
  await text(page, "libraryWatchOpen").click();
  await expect(
    page.locator("#libraryWantedList .library-news-card"),
  ).toHaveCount(1);
  expect(forbidden).toBe(0);
});
add(63, async ({ page }) => {
  await news(page, "error");
  await expect(text(page, "libraryNewsStatus")).toContainText(
    "Fixture indisponible",
  );
  await expect(text(page, "libraryRefresh")).toBeEnabled();
  await page.unroute("**/api/library-news?**");
  await page.route("**/api/library-news?**", (r) =>
    r.fulfill({ contentType: "text/plain", body: "not json" }),
  );
  await text(page, "libraryRefresh").click();
  await expect(text(page, "libraryRefresh")).toBeEnabled();
  await expect(text(page, "libraryNewsStatus")).not.toContainText(
    "Consultation de votre bibliothèque…",
  );
});
add(64, async ({ page }) => {
  await childForm(page);
  await text(page, "bookTitle").fill("Brouillon");
  await text(page, "cancelBook").click();
  await expect(page.locator("#savedBooks article")).toHaveCount(0);
  await page.reload();
  await expect(page.locator("#savedBooks article")).toHaveCount(0);
});
add(65, async ({ page }) => {
  await childForm(page);
  await text(page, "bookTitle").fill("Livre ECL-065");
  await text(page, "bookAuthor").fill("Auteur test");
  await page.locator('input[name=rating][value="3"]').check();
  await text(page, "bookComment").fill("Très bien");
  await text(page, "saveBook").click();
  await page.reload();
  await expect(page.locator("#savedBooks article")).toHaveCount(1);
  await expect(text(page, "savedBooks")).toContainText("Livre ECL-065");
  await expect(text(page, "savedBooks")).toContainText("Auteur test");
  await expect(text(page, "savedBooks")).toContainText("3/5");
  await expect(text(page, "savedBooks")).toContainText("Très bien");
});
add(66, async ({ page }) => {
  await childForm(page);
  await page.locator('input[name=rating][value="2"]').check();
  await page.locator('input[name=rating][value="4"]').check();
  await expect(page.locator("input[name=rating]:checked")).toHaveCount(1);
  await expect(page.locator("input[name=rating]:checked")).toHaveValue("4");
  await page.locator('input[name=rating][value="4"]').focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("input[name=rating]:checked")).toHaveValue("5");
  await text(page, "bookTitle").fill("Étoiles");
  await text(page, "bookAuthor").fill("Test");
  await text(page, "saveBook").click();
  await expect(text(page, "savedBooks")).toContainText("5/5");
});
add(68, async ({ page }) => {
  await go(page, "/migration.html");
  const b = backup([book()]);
  b.localStorage.eclat_saved_v1 = '["fixture-favorite"]';
  await importBackup(page, b);
  const before = await page.evaluate(() => EclatTransfer.exportData());
  const after = await exportBackup(page);
  expect(after.application).toBe("Eclat");
  expect(after.version).toBe(1);
  expect(after.databases).toEqual(before.databases);
  expect(after.localStorage).toEqual(before.localStorage);
  expect(
    (await page.evaluate(() => EclatTransfer.exportData())).databases,
  ).toEqual(before.databases);
});
add(69, async ({ page, browser }) => {
  await go(page, "/migration.html");
  const value = await exportBackup(page);
  expect(value.databases.every((d) => d.records.length === 0)).toBe(true);
  const context = await browser.newContext();
  try {
    await s.secure(context);
    const other = await context.newPage();
    await go(other, "/migration.html");
    await importBackup(other, value);
    const actual = await exportBackup(other);
    expect(actual.databases.every((d) => d.records.length === 0)).toBe(true);
  } finally {
    await context.close();
  }
});
add(70, async ({ page }) => {
  await go(page, "/migration.html");
  await importBackup(page, backup());
  const marker = "ECL-070-unique";
  await page.evaluate(
    (v) => localStorage.setItem("eclat_test_marker", v),
    marker,
  );
  const sent = [];
  page.on("request", (r) => sent.push(r.url() + " " + (r.postData() || "")));
  const b = await exportBackup(page);
  expect(b.localStorage.eclat_test_marker).toBe(marker);
  expect(sent.join("\n")).not.toContain(marker);
});
add(71, async ({ page }) => {
  await go(page, "/migration.html");
  const input = backup([book()]);
  await importBackup(page, input);
  await page.reload();
  const actual = await exportBackup(page);
  expect(actual.localStorage.eclat_test_marker).toBe(
    input.localStorage.eclat_test_marker,
  );
  expect(actual.databases.find((d) => d.store === "books").records).toEqual(
    input.databases[0].records,
  );
});
add(72, async ({ page }) => {
  await go(page, "/migration.html");
  await importBackup(page, backup([book("B")]));
  await importBackup(page, backup([book("A")]));
  await importBackup(page, backup([book("A")]));
  await page.reload();
  const b = await exportBackup(page);
  expect(
    b.databases
      .find((d) => d.store === "books")
      .records.map((r) => r.id)
      .sort(),
  ).toEqual(["A", "B"]);
});
add(73, async ({ page }) => {
  await go(page, "/migration.html");
  await importBackup(page, backup([book()]));
  const before = (await exportBackup(page)).databases;
  for (const content of [
    "{broken",
    JSON.stringify({ ...backup(), version: 999 }),
    JSON.stringify({
      application: "Eclat",
      version: 1,
      localStorage: [],
      databases: "wrong",
    }),
  ]) {
    await text(page, "importData").setInputFiles({
      name: "invalid.json",
      mimeType: "application/json",
      buffer: Buffer.from(content),
    });
    await expect(text(page, "confirmImport")).toBeDisabled();
    await expect(text(page, "transferStatus")).not.toHaveText("");
    expect((await exportBackup(page)).databases).toEqual(before);
  }
});
add(74, async ({ page }) => {
  await go(page, "/migration.html");
  await expect(text(page, "confirmImport")).toBeDisabled();
  await text(page, "importData").setInputFiles([]);
  await expect(text(page, "confirmImport")).toBeDisabled();
});
add(75, async ({ page, browser }) => {
  await reader(page);
  await text(page, "saveExcerpt").click();
  const context = await browser.newContext();
  try {
    await s.secure(context);
    const other = await context.newPage();
    await home(other);
    await expect(text(other, "savedCount")).toHaveText("0");
    await page.reload();
    await expect(text(page, "savedCount")).toHaveText("1");
  } finally {
    await context.close();
  }
});
add(76, async ({ page }) => {
  await childForm(page);
  await text(page, "bookTitle").fill("Conservé");
  await text(page, "bookAuthor").fill("Test");
  await text(page, "saveBook").click();
  await text(page, "newBook").click();
  await text(page, "bookTitle").fill("Quota");
  await text(page, "bookAuthor").fill("Test");
  await page.evaluate(() => {
    window.__put = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function () {
      throw new DOMException("Fixture quota", "QuotaExceededError");
    };
  });
  await text(page, "saveBook").click();
  await expect(text(page, "bookSaveMessage")).toContainText(
    "pas pu être enregistré",
  );
  await page.evaluate(() => (IDBObjectStore.prototype.put = window.__put));
  await page.reload();
  await expect(text(page, "savedBooks")).toContainText("Conservé");
  await expect(text(page, "savedBooks")).not.toContainText("Quota");
});
add(78, async ({ page }) => {
  await reader(page);
  const href = await page
    .getByRole("link", { name: "Voix et crédits" })
    .getAttribute("href");
  await go(page, href);
  for (const value of ["Siwis", "Tom", "Piper"])
    await expect(page.locator("body")).toContainText(value);
  await expect(page.locator('a[href^="https://"]')).not.toHaveCount(0);
});
add(82, async ({ page }) => {
  await home(page);
  await page.keyboard.press("Tab");
  await expect(page.locator(".comfort-skip")).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("main")).toBeFocused();
});
add(85, async ({ page }, info) => {
  const AxeBuilder = require("@axe-core/playwright").default;
  async function scan(label) {
    const result = await new AxeBuilder({ page }).analyze();
    await info.attach(label, {
      body: Buffer.from(
        JSON.stringify(
          { violations: result.violations, incomplete: result.incomplete },
          null,
          2,
        ),
      ),
      contentType: "application/json",
    });
    expect
      .soft(
        result.violations.filter((v) =>
          ["critical", "serious"].includes(v.impact),
        ),
        label,
      )
      .toEqual([]);
  }
  for (const [path] of routes) {
    await go(page, path);
    await scan(path);
  }
  await reader(page);
  await scan("lecteur-ouvert");
  await text(page, "readerClose").click();
  await comfort(page);
  await scan("confort-ouvert");
  await adultForm(page);
  await scan("formulaire-adultes");
  await childForm(page);
  await scan("formulaire-enfants");
});
add(91, async ({ page }) => {
  const value = '<b data-ecl-test="1">ECL-091</b>';
  await childForm(page);
  for (const id of ["bookTitle", "bookAuthor", "bookComment"])
    await text(page, id).fill(value);
  await text(page, "saveBook").click();
  await page.reload();
  await expect(text(page, "savedBooks")).toContainText(value);
  await expect(page.locator("[data-ecl-test]")).toHaveCount(0);
  await adultForm(page);
  await text(page, 'returnDate').fill('2030-01-15');
  await text(page, 'galleryPhoto').setInputFiles(png);
  await expect(page.locator('#photoList img')).toBeVisible();
  await text(page, "borrowAgain").fill(value);
  await text(page, "reserveBooks").fill(value);
  await text(page, "saveButton").click();
  await page.reload();
  await expect(text(page, "loansList")).toContainText(value);
  await expect(page.locator("[data-ecl-test]")).toHaveCount(0);
});
add(92, async (_args, info) => {
  info.setTimeout(120000);
  const engines = require("playwright");
  for (const name of ["chromium", "firefox", "webkit"]) {
    const browser = await engines[name].launch();
    try {
      const context = await browser.newContext({
        serviceWorkers: "block",
        locale: "fr-FR",
        timezoneId: "Europe/Paris",
      });
      await s.secure(context);
      const page = await context.newPage();
      await reader(page);
      await text(page, "readerClose").click();
      await go(page, "/emprunts.html");
      await createLoan(page);
      await expect(page.locator(".loan-row")).toHaveCount(1);
      await childForm(page);
      await text(page, "bookTitle").fill("Moteur " + name);
      await text(page, "bookAuthor").fill("Test");
      await text(page, "saveBook").click();
      await expect(text(page, "savedBooks")).toContainText("Moteur " + name);
      await go(page, "/migration.html");
      const value = await exportBackup(page);
      expect(value.databases.some((d) => d.records.length > 0)).toBe(true);
      info.annotations.push({
        type: "moteur",
        description: name + " " + browser.version(),
      });
    } finally {
      await browser.close();
    }
  }
});

add(13, async ({ page }) => {
  const p=await setupPassage(page,'work');
  await page.evaluate(p=>{
    const h=passageHistory();
    for(const q of PASSAGES.filter(q=>q.audience===p.audience&&q.workTitle===p.workTitle&&q.author===p.author))h[q.id]=Date.now();
    localStorage.setItem(passageHistoryKey(),JSON.stringify(h));
  },p);
  await text(page,'sameWork').click();
  await expect(text(page,'workExhausted')).toContainText('Tous les passages disponibles');
  expect(await page.evaluate(()=>window.eclatCurrentPassage.id)).toBe(p.id);
  await page.getByRole('button',{name:'Découvrir une autre œuvre'}).click();
  expect(await page.evaluate(()=>window.eclatCurrentPassage.workTitle)).not.toBe(p.workTitle);
});
add(55, async ({page},info)=>{
  info.setTimeout(90000);
  await adultForm(page);
  for(const type of ['image/jpeg','image/png','image/webp']){
    const data=await page.evaluate(type=>{const canvas=document.createElement('canvas');canvas.width=2;canvas.height=2;return canvas.toDataURL(type).split(',')[1]},type);
    await text(page,'galleryPhoto').setInputFiles({name:'image',mimeType:type,buffer:Buffer.from(data,'base64')});
    await expect(page.locator('#photoList img')).toHaveCount(1);
    await expect(text(page,'photoStatus')).toContainText('prête');
  }
  await text(page,'galleryPhoto').setInputFiles({name:'unsupported.gif',mimeType:'image/gif',buffer:Buffer.from('GIF89a')});
  await expect(text(page,'photoStatus')).toContainText('JPEG, PNG ou WebP');
  await expect(page.locator('#photoList img')).toHaveCount(1);
  await text(page,'galleryPhoto').setInputFiles({...png,buffer:Buffer.concat([png.buffer,Buffer.alloc(11*1024*1024)])});
  await expect(text(page,'photoStatus')).toContainText('prête');
  await childForm(page);
  await text(page,'galleryPhotos').setInputFiles(Array.from({length:50},(_,i)=>({...png,name:i+'.png'})));
  await expect(page.locator('#bookPhotos img')).toHaveCount(50);
  await text(page,'galleryPhotos').setInputFiles(png);
  await expect(text(page,'photoMessage')).toContainText('50 photos');
  await expect(page.locator('#bookPhotos img')).toHaveCount(50);
});
add(67, async ({page})=>{
  await childForm(page);
  for(const id of ['bookTitle','bookAuthor'])await expect(text(page,id)).toHaveAttribute('maxlength','250');
  await expect(text(page,'bookComment')).toHaveAttribute('maxlength','2000');
  await text(page,'bookTitle').fill('Titre');await text(page,'bookAuthor').fill('Auteur');
  await text(page,'bookComment').evaluate(e=>e.value='x'.repeat(2001));
  await text(page,'saveBook').click();await expect(text(page,'bookSaveMessage')).toContainText('2 000');
  await expect(text(page,'bookForm')).toBeVisible();
  await text(page,'bookTitle').fill('T'.repeat(250));await text(page,'bookAuthor').fill('A'.repeat(250));await text(page,'bookComment').fill('C'.repeat(2000));
  await text(page,'saveBook').click();await expect(text(page,'bookForm')).toBeHidden();
  await expect(text(page,'savedBooks')).toContainText('T'.repeat(250));
});
add(77, async ({page})=>{
  await home(page);
  const result=await page.evaluate(()=>{
    const p=PASSAGES.find(p=>p.audience==='adult'&&p.text);
    const old=Date.now()-400*24*60*60*1000;
    localStorage.setItem(passageHistoryKey(),JSON.stringify({[p.id]:old}));
    const retained=passageHistory()[p.id]===old;
    rememberPassages([p]);rememberPassages([p]);
    return {retained,id:p.id,last:passageHistory()[p.id],count:Object.keys(passageHistory()).length};
  });
  expect(result.retained).toBe(true);expect(result.count).toBe(1);expect(result.last).toBeGreaterThan(Date.now()-10000);
  await page.reload();
  expect(await page.evaluate(id=>passageHistory()[id],result.id)).toBe(result.last);
});

async function everyF12(browser,info,check){
  const profiles=require('../devtools-devices.json').profiles;
  info.setTimeout(1800000);
  const failures=[];
  for(const {name,...device} of profiles){
    const context=await browser.newContext({...device,locale:'fr-FR',timezoneId:'Europe/Paris',serviceWorkers:'block'});
    try{
      await s.secure(context);
      const page=await context.newPage();page.setDefaultTimeout(10000);page.setDefaultNavigationTimeout(15000);
      await test.step(name,()=>check(page,device));
    }catch(error){failures.push({profile:name,error:error.message});}
    finally{await context.close();}
  }
  await info.attach('profils-F12.json',{body:Buffer.from(JSON.stringify({profiles:profiles.length,failures},null,2)),contentType:'application/json'});
  expect(failures,'Profils F12 en échec : '+failures.map(x=>x.profile).join(', ')).toEqual([]);
}
add(88,async({browser},info)=>everyF12(browser,info,page=>require('../support/responsive').checkResponsive(page,info)));
add(90,async({browser},info)=>everyF12(browser,info,async(page,device)=>{
  await childForm(page);await text(page,'bookTitle').fill('Brouillon conservé');await text(page,'bookAuthor').fill('Auteur');
  await page.setViewportSize({width:device.viewport.height,height:device.viewport.width});
  await expect(text(page,'bookTitle')).toHaveValue('Brouillon conservé');
  await expect(text(page,'saveBook')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
  await text(page,'saveBook').click();await expect(text(page,'bookForm')).toBeHidden();
  await audioFixture(page);await reader(page);await text(page,'listenToggle').click();await playing(page);
  await page.setViewportSize(device.viewport);await playing(page);
  const size=await text(page,'listenToggle').boundingBox();expect(size.width).toBeGreaterThanOrEqual(44);expect(size.height).toBeGreaterThanOrEqual(44);
  await text(page,'listenStop').click();await stopped(page);
}));

for (const c of catalog) {
  if (c.number === 1) continue; // Kept in accueil.spec.js to preserve its existing reference.
  const fn = checks.get(c.number);
  const register = fn ? test : test.skip;
  register(
    c.reference + " " + c.name,
    async ({ page, context, browser }, info) => {
      info.annotations.push({
        type: "squash-reference",
        description: c.reference,
      });
      if (!fn) {
        info.annotations.push({
          type: "non-exécutable",
          description: c.reason,
        });
        return;
      }
      if (c.status === "partial")
        info.annotations.push({
          type: "couverture-partielle",
          description: c.reason,
        });
      await fn({ page, context, browser }, info);
    },
  );
}
module.exports.implemented = [...checks.keys()];
