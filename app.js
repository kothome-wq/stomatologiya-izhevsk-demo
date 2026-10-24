/* РСП – демо. Данные подразделений и часы взяты с rsp-udm.ru/contacts.htm (на 24.10.2026).
   Профили приёма (tags) – только то, что прямо сказано на сайте; остальное уточнить у заказчика. */
(function () {
  "use strict";

  var H = function (h, m) { return h * 60 + (m || 0); };
  // часы: wk – будни, sat – суббота, sun – воскресенье; интервалы в минутах, конец > 1440 = после полуночи
  var BRANCHES = [
    { n: 1, city: "izh", addr: "ул. Коммунаров, 231", how: "Троллейбус № 4, автобусы № 12, 27, 28, 32, 40 до ост. «Магазин Светлана». Есть пандус.",
      tags: ["Взрослым", "Лечение зубов", "Хирургия", "Пародонтология"], f: ["adult"],
      tel: [["Регистратура", "(3412) 311-225"]],
      wk: [[H(7, 30), H(20)]], sat: [[H(9), H(18)]], sun: [] },
    { n: 2, city: "izh", addr: "ул. Советская, 20", how: "",
      tags: ["Взрослым", "Лечение зубов"], f: ["adult"],
      tel: [["Регистратура", "(3412) 311-451"]],
      wk: [[H(7, 30), H(20)]], sat: [[H(9), H(18)]], sun: [] },
    { n: 3, city: "izh", addr: "ул. 9 Января, 197А", how: "",
      tags: ["Взрослым", "Детям"], f: ["adult", "kids"],
      tel: [["Взрослая регистратура", "(3412) 334-173"], ["Детская регистратура", "(3412) 334-174"]],
      wk: [[H(7, 30), H(20)]], sat: [[H(9), H(18)]], sun: [] },
    { n: 4, city: "izh", addr: "ул. 40 лет Победы, 50", how: "",
      tags: [], f: [],
      tel: [["Регистратура", "(3412) 792-850"]],
      wk: [[H(7, 30), H(20)]], sat: [], sun: [] },
    { n: 5, city: "izh", addr: "ул. 30 лет Победы, 32А", how: "",
      tags: ["Протезирование"], f: ["prosth"],
      tel: [["Регистратура", "(3412) 330-335"], ["Кабинет протезирования", "(3412) 330-450"]],
      wk: [[H(7, 30), H(20)]], sat: [[H(9), H(18)]], sun: [] },
    { n: 6, city: "izh", addr: "ул. Кирова, 111А", how: "Трамваи № 1, 2, 4, 7, 9, 10 до ост. «Магазин Океан».",
      tags: ["Протезирование", "Исправление прикуса", "Лечение зубов", "Хирургия"], f: ["prosth", "adult"],
      tel: [["Регистратура", "(3412) 330-515"]],
      wk: [[H(7, 30), H(20)]], sat: [], sun: [] },
    { n: 7, city: "sar", addr: "Сарапул, ул. Азина, 17", how: "Кабинет неотложной помощи – в субботу, воскресенье и праздники с 8:00 до 14:00.",
      tags: ["Неотложная помощь в выходные"], f: [],
      tel: [["Регистратура", "(34147) 4-14-05"]],
      wk: [[H(7, 30), H(20)]], sat: [[H(8), H(14)]], sun: [[H(8), H(14)]] },
    { n: 8, city: "sar", addr: "Сарапул, ул. Фрунзе, 10", how: "",
      tags: [], f: [],
      tel: [["Регистратура", "(34147) 3-96-54"]],
      wk: [[H(7, 30), H(19)]], sat: [], sun: [] }
  ];
  // неотложная помощь взрослым: Коммунаров, 231, вход с ул. Советской
  var URGENT = { wk: [[H(21), H(30)]], sat: [[H(21), H(30)]], sun: [[H(9), H(14)], [H(15), H(20)], [H(21), H(30)]] };

  var DAYS = ["воскресенье", "понедельник", "вторник", "среда", "четверг", "пятница", "суббота"];
  var DAYS_AT = ["в воскресенье", "в понедельник", "во вторник", "в среду", "в четверг", "в пятницу", "в субботу"];

  function slot(s, d) { return d === 0 ? s.sun : d === 6 ? s.sat : s.wk; }
  function fmt(m) { m = ((m % 1440) + 1440) % 1440; var h = Math.floor(m / 60), mm = m % 60; return h + ":" + (mm < 10 ? "0" : "") + mm; }
  function telHref(t) { var d = t.replace(/\D/g, ""); return "tel:+7" + d; }

  // открыто ли сейчас; возвращает конец интервала (минуты от начала сегодняшних суток) или -1
  function openUntil(s, d, m) {
    var i, iv = slot(s, d);
    for (i = 0; i < iv.length; i++) if (m >= iv[i][0] && m < iv[i][1]) return iv[i][1];
    var prev = slot(s, (d + 6) % 7);
    for (i = 0; i < prev.length; i++) if (prev[i][1] > 1440 && m + 1440 < prev[i][1]) return prev[i][1] - 1440;
    return -1;
  }
  function nextOpen(s, d, m) {
    for (var k = 0; k < 8; k++) {
      var dd = (d + k) % 7, iv = slot(s, dd);
      for (var i = 0; i < iv.length; i++) if (k > 0 || iv[i][0] > m) return { k: k, d: dd, at: iv[i][0] };
    }
    return null;
  }
  function whenText(nx) {
    if (!nx) return "";
    return (nx.k === 0 ? "сегодня в " : nx.k === 1 ? "завтра в " : DAYS_AT[nx.d] + " в ") + fmt(nx.at);
  }

  // время Ижевска (UTC+4); для показа заказчику: ?t=22:30&d=0
  function izhNow() {
    var q = new URLSearchParams(location.search), t = q.get("t"), d = q.get("d");
    if (t && /^\d{1,2}:\d{2}$/.test(t)) {
      var p = t.split(":"), now = new Date(Date.now() + 4 * 3600e3);
      return { m: H(+p[0], +p[1]), d: d !== null ? (+d % 7) : now.getUTCDay(), fixed: true };
    }
    var n = new Date(Date.now() + 4 * 3600e3);
    return { m: n.getUTCHours() * 60 + n.getUTCMinutes(), d: n.getUTCDay(), fixed: false };
  }

  /* ---------- табличка «Сейчас» ---------- */
  function renderBoard() {
    var b = document.getElementById("board");
    if (!b) return;
    var now = izhNow(), m = now.m, d = now.d;
    var open = BRANCHES.map(function (x) { return { x: x, u: openUntil(x, d, m) }; }).filter(function (o) { return o.u >= 0; });
    var urg = openUntil(URGENT, d, m);
    var night = open.length === 0;

    b.classList.toggle("is-night", night);
    b.querySelector("[data-clock]").textContent = fmt(m);
    b.querySelector("[data-day]").textContent = DAYS[d];

    var sum = b.querySelector("[data-sum]"), list = b.querySelector("[data-list]");
    list.innerHTML = "";
    if (open.length) {
      sum.innerHTML = '<span class="dot"></span>Открыто ' + open.length + " " + plural(open.length, ["подразделение", "подразделения", "подразделений"]) + " из 8";
      open.slice(0, 4).forEach(function (o, i) {
        var li = document.createElement("li");
        li.style.setProperty("--i", i);
        li.innerHTML = '<a href="index.html#br-' + o.x.n + '">№ ' + o.x.n + ", " + o.x.addr + "</a><span>до " + fmt(o.u) + "</span>";
        list.appendChild(li);
      });
      if (open.length > 4) {
        var more = document.createElement("li");
        more.style.setProperty("--i", 4);
        more.innerHTML = '<a href="index.html#podrazdeleniya">Ещё ' + (open.length - 4) + " – в списке подразделений</a><span></span>";
        list.appendChild(more);
      }
    } else {
      var first = BRANCHES.map(function (x) { return { x: x, nx: nextOpen(x, d, m) }; })
        .filter(function (o) { return o.nx; })
        .sort(function (a, c) { return (a.nx.k * 1440 + a.nx.at) - (c.nx.k * 1440 + c.nx.at); })[0];
      sum.innerHTML = '<span class="dot dot--off"></span>Плановый приём закрыт';
      var li2 = document.createElement("li");
      li2.innerHTML = "<span>Регистратуры откроются</span><span>" + whenText(first.nx) + "</span>";
      list.appendChild(li2);
    }

    var u = b.querySelector("[data-urgent]");
    u.classList.toggle("is-on", urg >= 0);
    if (urg >= 0) {
      u.innerHTML = '<strong><span class="dot"></span>Неотложная помощь работает сейчас – до ' + fmt(urg) + "</strong>" +
        "Взрослым с 18 лет. Ижевск, ул. Коммунаров, 231, вход со стороны ул. Советской.";
    } else {
      u.innerHTML = "<strong>Неотложная помощь взрослым</strong>" +
        "Ул. Коммунаров, 231, вход с ул. Советской: каждый день с 21:00 до 6:00, в воскресенье и праздники ещё и днём. Откроется " +
        whenText(nextOpen(URGENT, d, m)) + ".";
    }
    b.querySelector("[data-note]").textContent = now.fixed
      ? "Показано для времени из ссылки. Праздничные дни табличка не учитывает – режим в праздники публикуется в новостях."
      : "Время ижевское. В праздники режим другой – он публикуется в новостях.";
  }

  function plural(n, f) {
    var a = n % 100, b = n % 10;
    return a > 10 && a < 20 ? f[2] : b === 1 ? f[0] : b > 1 && b < 5 ? f[1] : f[2];
  }

  /* ---------- список подразделений ---------- */
  function hoursRow(name, iv) {
    var v = iv.length ? iv.map(function (x) { return fmt(x[0]) + "–" + fmt(x[1]); }).join(", ") : "выходной";
    return "<div><dt>" + name + "</dt><dd>" + v + "</dd></div>";
  }
  function renderBranches() {
    var ul = document.getElementById("branches");
    if (!ul) return;
    var now = izhNow();
    ul.innerHTML = BRANCHES.map(function (x) {
      var u = openUntil(x, now.d, now.m), st;
      if (u >= 0) st = '<p class="state ' + (u - now.m <= 60 ? "is-soon" : "is-open") + '">Открыто до ' + fmt(u) + "</p>";
      else st = '<p class="state">Закрыто. Откроется ' + whenText(nextOpen(x, now.d, now.m)) + "</p>";
      return '<li class="br" id="br-' + x.n + '" data-city="' + x.city + '" data-f="' + x.f.join(" ") + '" data-open="' + (u >= 0 ? 1 : 0) + '">' +
        '<p class="br__n"><span class="sr">Подразделение </span>№ ' + x.n + "</p>" +
        '<div><p class="br__addr">' + x.addr + "</p>" +
        (x.how ? '<p class="br__how">' + x.how + "</p>" : "") +
        (x.tags.length ? '<p class="br__tags">' + x.tags.map(function (t) { return '<span class="tag">' + t + "</span>"; }).join("") + "</p>" : "") +
        "</div>" +
        '<div class="br__tel">' + x.tel.map(function (t) { return '<div><span class="br__k">' + t[0] + '</span><a href="' + telHref(t[1]) + '">' + t[1] + "</a></div>"; }).join("") + "</div>" +
        '<dl class="br__hours">' + hoursRow("Пн–Пт", x.wk) + hoursRow("Сб", x.sat) + hoursRow("Вс", x.sun) + "</dl>" +
        st + "</li>";
    }).join("");
    applyFilter(currentFilter);
  }

  var currentFilter = "all";
  function applyFilter(f) {
    currentFilter = f;
    var shown = 0;
    document.querySelectorAll("#branches .br").forEach(function (li) {
      var ok = f === "all" || (f === "izh" || f === "sar" ? li.dataset.city === f : f === "open" ? li.dataset.open === "1" : (" " + li.dataset.f + " ").indexOf(" " + f + " ") > -1);
      li.hidden = !ok;
      if (ok) shown++;
    });
    var empty = document.getElementById("branches-empty");
    if (empty) empty.hidden = shown > 0;
    document.querySelectorAll("[data-filter]").forEach(function (c) { c.setAttribute("aria-pressed", c.dataset.filter === f ? "true" : "false"); });
  }

  /* ---------- версия для слабовидящих ---------- */
  var root = document.documentElement;
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  function setA11y(on) {
    root.classList.toggle("is-a11y", on);
    if (!on) { root.classList.remove("a11y-contrast", "a11y-noimg"); root.style.removeProperty("--scale"); }
    else { root.classList.add("a11y-contrast"); setScale(store("rsp-scale") || "1.25"); }
    var btn = document.querySelector("[data-a11y]");
    if (btn) { btn.setAttribute("aria-pressed", on ? "true" : "false"); btn.querySelector("span").textContent = on ? "Обычная версия" : "Версия для слабовидящих"; }
    store("rsp-a11y", on ? "1" : "0");
  }
  function setScale(s) {
    root.style.setProperty("--scale", s);
    store("rsp-scale", s);
    document.querySelectorAll("[data-scale]").forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.scale === s ? "true" : "false"); });
  }

  document.addEventListener("click", function (e) {
    var t = e.target.closest("button");
    if (!t) return;
    if (t.hasAttribute("data-a11y")) setA11y(!root.classList.contains("is-a11y"));
    else if (t.dataset.scale) setScale(t.dataset.scale);
    else if (t.hasAttribute("data-noimg")) { var on = root.classList.toggle("a11y-noimg"); t.setAttribute("aria-pressed", on ? "true" : "false"); }
    else if (t.hasAttribute("data-contrast")) { var c = root.classList.toggle("a11y-contrast"); t.setAttribute("aria-pressed", c ? "true" : "false"); }
    else if (t.dataset.filter) applyFilter(t.dataset.filter);
    else if (t.hasAttribute("data-menu")) {
      var o = root.classList.toggle("is-menu");
      t.setAttribute("aria-expanded", o ? "true" : "false");
    }
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && root.classList.contains("is-menu")) {
      root.classList.remove("is-menu");
      var mb = document.querySelector("[data-menu]");
      if (mb) { mb.setAttribute("aria-expanded", "false"); mb.focus(); }
    }
  });

  if (store("rsp-a11y") === "1") setA11y(true);
  renderBoard();
  renderBranches();
  setTimeout(function () { var b = document.getElementById("board"); if (b) b.classList.remove("is-first"); }, 2000);
  if (!izhNow().fixed) setInterval(function () { renderBoard(); renderBranches(); }, 30000);
})();
