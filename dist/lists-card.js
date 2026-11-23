/*! lists-card 1.1.1 | MIT License */
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i7 = decorators.length - 1, decorator; i7 >= 0; i7--)
    if (decorator = decorators[i7])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result) __defProp(target, key, result);
  return result;
};

// node_modules/@lit/reactive-element/css-tag.js
var t = globalThis;
var e = t.ShadowRoot && (void 0 === t.ShadyCSS || t.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype;
var s = /* @__PURE__ */ Symbol();
var o = /* @__PURE__ */ new WeakMap();
var n = class {
  constructor(t6, e6, o6) {
    if (this._$cssResult$ = true, o6 !== s) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = t6, this.t = e6;
  }
  get styleSheet() {
    let t6 = this.o;
    const s5 = this.t;
    if (e && void 0 === t6) {
      const e6 = void 0 !== s5 && 1 === s5.length;
      e6 && (t6 = o.get(s5)), void 0 === t6 && ((this.o = t6 = new CSSStyleSheet()).replaceSync(this.cssText), e6 && o.set(s5, t6));
    }
    return t6;
  }
  toString() {
    return this.cssText;
  }
};
var r = (t6) => new n("string" == typeof t6 ? t6 : t6 + "", void 0, s);
var i = (t6, ...e6) => {
  const o6 = 1 === t6.length ? t6[0] : e6.reduce((e7, s5, o7) => e7 + ((t7) => {
    if (true === t7._$cssResult$) return t7.cssText;
    if ("number" == typeof t7) return t7;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + t7 + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(s5) + t6[o7 + 1], t6[0]);
  return new n(o6, t6, s);
};
var S = (s5, o6) => {
  if (e) s5.adoptedStyleSheets = o6.map((t6) => t6 instanceof CSSStyleSheet ? t6 : t6.styleSheet);
  else for (const e6 of o6) {
    const o7 = document.createElement("style"), n5 = t.litNonce;
    void 0 !== n5 && o7.setAttribute("nonce", n5), o7.textContent = e6.cssText, s5.appendChild(o7);
  }
};
var c = e ? (t6) => t6 : (t6) => t6 instanceof CSSStyleSheet ? ((t7) => {
  let e6 = "";
  for (const s5 of t7.cssRules) e6 += s5.cssText;
  return r(e6);
})(t6) : t6;

// node_modules/@lit/reactive-element/reactive-element.js
var { is: i2, defineProperty: e2, getOwnPropertyDescriptor: h, getOwnPropertyNames: r2, getOwnPropertySymbols: o2, getPrototypeOf: n2 } = Object;
var a = globalThis;
var c2 = a.trustedTypes;
var l = c2 ? c2.emptyScript : "";
var p = a.reactiveElementPolyfillSupport;
var d = (t6, s5) => t6;
var u = { toAttribute(t6, s5) {
  switch (s5) {
    case Boolean:
      t6 = t6 ? l : null;
      break;
    case Object:
    case Array:
      t6 = null == t6 ? t6 : JSON.stringify(t6);
  }
  return t6;
}, fromAttribute(t6, s5) {
  let i7 = t6;
  switch (s5) {
    case Boolean:
      i7 = null !== t6;
      break;
    case Number:
      i7 = null === t6 ? null : Number(t6);
      break;
    case Object:
    case Array:
      try {
        i7 = JSON.parse(t6);
      } catch (t7) {
        i7 = null;
      }
  }
  return i7;
} };
var f = (t6, s5) => !i2(t6, s5);
var b = { attribute: true, type: String, converter: u, reflect: false, useDefault: false, hasChanged: f };
Symbol.metadata ?? (Symbol.metadata = /* @__PURE__ */ Symbol("metadata")), a.litPropertyMetadata ?? (a.litPropertyMetadata = /* @__PURE__ */ new WeakMap());
var y = class extends HTMLElement {
  static addInitializer(t6) {
    this._$Ei(), (this.l ?? (this.l = [])).push(t6);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(t6, s5 = b) {
    if (s5.state && (s5.attribute = false), this._$Ei(), this.prototype.hasOwnProperty(t6) && ((s5 = Object.create(s5)).wrapped = true), this.elementProperties.set(t6, s5), !s5.noAccessor) {
      const i7 = /* @__PURE__ */ Symbol(), h4 = this.getPropertyDescriptor(t6, i7, s5);
      void 0 !== h4 && e2(this.prototype, t6, h4);
    }
  }
  static getPropertyDescriptor(t6, s5, i7) {
    const { get: e6, set: r6 } = h(this.prototype, t6) ?? { get() {
      return this[s5];
    }, set(t7) {
      this[s5] = t7;
    } };
    return { get: e6, set(s6) {
      const h4 = e6?.call(this);
      r6?.call(this, s6), this.requestUpdate(t6, h4, i7);
    }, configurable: true, enumerable: true };
  }
  static getPropertyOptions(t6) {
    return this.elementProperties.get(t6) ?? b;
  }
  static _$Ei() {
    if (this.hasOwnProperty(d("elementProperties"))) return;
    const t6 = n2(this);
    t6.finalize(), void 0 !== t6.l && (this.l = [...t6.l]), this.elementProperties = new Map(t6.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(d("finalized"))) return;
    if (this.finalized = true, this._$Ei(), this.hasOwnProperty(d("properties"))) {
      const t7 = this.properties, s5 = [...r2(t7), ...o2(t7)];
      for (const i7 of s5) this.createProperty(i7, t7[i7]);
    }
    const t6 = this[Symbol.metadata];
    if (null !== t6) {
      const s5 = litPropertyMetadata.get(t6);
      if (void 0 !== s5) for (const [t7, i7] of s5) this.elementProperties.set(t7, i7);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [t7, s5] of this.elementProperties) {
      const i7 = this._$Eu(t7, s5);
      void 0 !== i7 && this._$Eh.set(i7, t7);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(s5) {
    const i7 = [];
    if (Array.isArray(s5)) {
      const e6 = new Set(s5.flat(1 / 0).reverse());
      for (const s6 of e6) i7.unshift(c(s6));
    } else void 0 !== s5 && i7.push(c(s5));
    return i7;
  }
  static _$Eu(t6, s5) {
    const i7 = s5.attribute;
    return false === i7 ? void 0 : "string" == typeof i7 ? i7 : "string" == typeof t6 ? t6.toLowerCase() : void 0;
  }
  constructor() {
    super(), this._$Ep = void 0, this.isUpdatePending = false, this.hasUpdated = false, this._$Em = null, this._$Ev();
  }
  _$Ev() {
    this._$ES = new Promise((t6) => this.enableUpdating = t6), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), this.constructor.l?.forEach((t6) => t6(this));
  }
  addController(t6) {
    (this._$EO ?? (this._$EO = /* @__PURE__ */ new Set())).add(t6), void 0 !== this.renderRoot && this.isConnected && t6.hostConnected?.();
  }
  removeController(t6) {
    this._$EO?.delete(t6);
  }
  _$E_() {
    const t6 = /* @__PURE__ */ new Map(), s5 = this.constructor.elementProperties;
    for (const i7 of s5.keys()) this.hasOwnProperty(i7) && (t6.set(i7, this[i7]), delete this[i7]);
    t6.size > 0 && (this._$Ep = t6);
  }
  createRenderRoot() {
    const t6 = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return S(t6, this.constructor.elementStyles), t6;
  }
  connectedCallback() {
    this.renderRoot ?? (this.renderRoot = this.createRenderRoot()), this.enableUpdating(true), this._$EO?.forEach((t6) => t6.hostConnected?.());
  }
  enableUpdating(t6) {
  }
  disconnectedCallback() {
    this._$EO?.forEach((t6) => t6.hostDisconnected?.());
  }
  attributeChangedCallback(t6, s5, i7) {
    this._$AK(t6, i7);
  }
  _$ET(t6, s5) {
    const i7 = this.constructor.elementProperties.get(t6), e6 = this.constructor._$Eu(t6, i7);
    if (void 0 !== e6 && true === i7.reflect) {
      const h4 = (void 0 !== i7.converter?.toAttribute ? i7.converter : u).toAttribute(s5, i7.type);
      this._$Em = t6, null == h4 ? this.removeAttribute(e6) : this.setAttribute(e6, h4), this._$Em = null;
    }
  }
  _$AK(t6, s5) {
    const i7 = this.constructor, e6 = i7._$Eh.get(t6);
    if (void 0 !== e6 && this._$Em !== e6) {
      const t7 = i7.getPropertyOptions(e6), h4 = "function" == typeof t7.converter ? { fromAttribute: t7.converter } : void 0 !== t7.converter?.fromAttribute ? t7.converter : u;
      this._$Em = e6;
      const r6 = h4.fromAttribute(s5, t7.type);
      this[e6] = r6 ?? this._$Ej?.get(e6) ?? r6, this._$Em = null;
    }
  }
  requestUpdate(t6, s5, i7, e6 = false, h4) {
    if (void 0 !== t6) {
      const r6 = this.constructor;
      if (false === e6 && (h4 = this[t6]), i7 ?? (i7 = r6.getPropertyOptions(t6)), !((i7.hasChanged ?? f)(h4, s5) || i7.useDefault && i7.reflect && h4 === this._$Ej?.get(t6) && !this.hasAttribute(r6._$Eu(t6, i7)))) return;
      this.C(t6, s5, i7);
    }
    false === this.isUpdatePending && (this._$ES = this._$EP());
  }
  C(t6, s5, { useDefault: i7, reflect: e6, wrapped: h4 }, r6) {
    i7 && !(this._$Ej ?? (this._$Ej = /* @__PURE__ */ new Map())).has(t6) && (this._$Ej.set(t6, r6 ?? s5 ?? this[t6]), true !== h4 || void 0 !== r6) || (this._$AL.has(t6) || (this.hasUpdated || i7 || (s5 = void 0), this._$AL.set(t6, s5)), true === e6 && this._$Em !== t6 && (this._$Eq ?? (this._$Eq = /* @__PURE__ */ new Set())).add(t6));
  }
  async _$EP() {
    this.isUpdatePending = true;
    try {
      await this._$ES;
    } catch (t7) {
      Promise.reject(t7);
    }
    const t6 = this.scheduleUpdate();
    return null != t6 && await t6, !this.isUpdatePending;
  }
  scheduleUpdate() {
    return this.performUpdate();
  }
  performUpdate() {
    if (!this.isUpdatePending) return;
    if (!this.hasUpdated) {
      if (this.renderRoot ?? (this.renderRoot = this.createRenderRoot()), this._$Ep) {
        for (const [t8, s6] of this._$Ep) this[t8] = s6;
        this._$Ep = void 0;
      }
      const t7 = this.constructor.elementProperties;
      if (t7.size > 0) for (const [s6, i7] of t7) {
        const { wrapped: t8 } = i7, e6 = this[s6];
        true !== t8 || this._$AL.has(s6) || void 0 === e6 || this.C(s6, void 0, i7, e6);
      }
    }
    let t6 = false;
    const s5 = this._$AL;
    try {
      t6 = this.shouldUpdate(s5), t6 ? (this.willUpdate(s5), this._$EO?.forEach((t7) => t7.hostUpdate?.()), this.update(s5)) : this._$EM();
    } catch (s6) {
      throw t6 = false, this._$EM(), s6;
    }
    t6 && this._$AE(s5);
  }
  willUpdate(t6) {
  }
  _$AE(t6) {
    this._$EO?.forEach((t7) => t7.hostUpdated?.()), this.hasUpdated || (this.hasUpdated = true, this.firstUpdated(t6)), this.updated(t6);
  }
  _$EM() {
    this._$AL = /* @__PURE__ */ new Map(), this.isUpdatePending = false;
  }
  get updateComplete() {
    return this.getUpdateComplete();
  }
  getUpdateComplete() {
    return this._$ES;
  }
  shouldUpdate(t6) {
    return true;
  }
  update(t6) {
    this._$Eq && (this._$Eq = this._$Eq.forEach((t7) => this._$ET(t7, this[t7]))), this._$EM();
  }
  updated(t6) {
  }
  firstUpdated(t6) {
  }
};
y.elementStyles = [], y.shadowRootOptions = { mode: "open" }, y[d("elementProperties")] = /* @__PURE__ */ new Map(), y[d("finalized")] = /* @__PURE__ */ new Map(), p?.({ ReactiveElement: y }), (a.reactiveElementVersions ?? (a.reactiveElementVersions = [])).push("2.1.2");

// node_modules/lit-html/lit-html.js
var t2 = globalThis;
var i3 = (t6) => t6;
var s2 = t2.trustedTypes;
var e3 = s2 ? s2.createPolicy("lit-html", { createHTML: (t6) => t6 }) : void 0;
var h2 = "$lit$";
var o3 = `lit$${Math.random().toFixed(9).slice(2)}$`;
var n3 = "?" + o3;
var r3 = `<${n3}>`;
var l2 = document;
var c3 = () => l2.createComment("");
var a2 = (t6) => null === t6 || "object" != typeof t6 && "function" != typeof t6;
var u2 = Array.isArray;
var d2 = (t6) => u2(t6) || "function" == typeof t6?.[Symbol.iterator];
var f2 = "[ 	\n\f\r]";
var v = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g;
var _ = /-->/g;
var m = />/g;
var p2 = RegExp(`>|${f2}(?:([^\\s"'>=/]+)(${f2}*=${f2}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g");
var g = /'/g;
var $ = /"/g;
var y2 = /^(?:script|style|textarea|title)$/i;
var x = (t6) => (i7, ...s5) => ({ _$litType$: t6, strings: i7, values: s5 });
var b2 = x(1);
var w = x(2);
var T = x(3);
var E = /* @__PURE__ */ Symbol.for("lit-noChange");
var A = /* @__PURE__ */ Symbol.for("lit-nothing");
var C = /* @__PURE__ */ new WeakMap();
var P = l2.createTreeWalker(l2, 129);
function V(t6, i7) {
  if (!u2(t6) || !t6.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return void 0 !== e3 ? e3.createHTML(i7) : i7;
}
var N = (t6, i7) => {
  const s5 = t6.length - 1, e6 = [];
  let n5, l3 = 2 === i7 ? "<svg>" : 3 === i7 ? "<math>" : "", c5 = v;
  for (let i8 = 0; i8 < s5; i8++) {
    const s6 = t6[i8];
    let a3, u5, d3 = -1, f3 = 0;
    for (; f3 < s6.length && (c5.lastIndex = f3, u5 = c5.exec(s6), null !== u5); ) f3 = c5.lastIndex, c5 === v ? "!--" === u5[1] ? c5 = _ : void 0 !== u5[1] ? c5 = m : void 0 !== u5[2] ? (y2.test(u5[2]) && (n5 = RegExp("</" + u5[2], "g")), c5 = p2) : void 0 !== u5[3] && (c5 = p2) : c5 === p2 ? ">" === u5[0] ? (c5 = n5 ?? v, d3 = -1) : void 0 === u5[1] ? d3 = -2 : (d3 = c5.lastIndex - u5[2].length, a3 = u5[1], c5 = void 0 === u5[3] ? p2 : '"' === u5[3] ? $ : g) : c5 === $ || c5 === g ? c5 = p2 : c5 === _ || c5 === m ? c5 = v : (c5 = p2, n5 = void 0);
    const x2 = c5 === p2 && t6[i8 + 1].startsWith("/>") ? " " : "";
    l3 += c5 === v ? s6 + r3 : d3 >= 0 ? (e6.push(a3), s6.slice(0, d3) + h2 + s6.slice(d3) + o3 + x2) : s6 + o3 + (-2 === d3 ? i8 : x2);
  }
  return [V(t6, l3 + (t6[s5] || "<?>") + (2 === i7 ? "</svg>" : 3 === i7 ? "</math>" : "")), e6];
};
var S2 = class _S {
  constructor({ strings: t6, _$litType$: i7 }, e6) {
    let r6;
    this.parts = [];
    let l3 = 0, a3 = 0;
    const u5 = t6.length - 1, d3 = this.parts, [f3, v3] = N(t6, i7);
    if (this.el = _S.createElement(f3, e6), P.currentNode = this.el.content, 2 === i7 || 3 === i7) {
      const t7 = this.el.content.firstChild;
      t7.replaceWith(...t7.childNodes);
    }
    for (; null !== (r6 = P.nextNode()) && d3.length < u5; ) {
      if (1 === r6.nodeType) {
        if (r6.hasAttributes()) for (const t7 of r6.getAttributeNames()) if (t7.endsWith(h2)) {
          const i8 = v3[a3++], s5 = r6.getAttribute(t7).split(o3), e7 = /([.?@])?(.*)/.exec(i8);
          d3.push({ type: 1, index: l3, name: e7[2], strings: s5, ctor: "." === e7[1] ? I : "?" === e7[1] ? L : "@" === e7[1] ? z : H }), r6.removeAttribute(t7);
        } else t7.startsWith(o3) && (d3.push({ type: 6, index: l3 }), r6.removeAttribute(t7));
        if (y2.test(r6.tagName)) {
          const t7 = r6.textContent.split(o3), i8 = t7.length - 1;
          if (i8 > 0) {
            r6.textContent = s2 ? s2.emptyScript : "";
            for (let s5 = 0; s5 < i8; s5++) r6.append(t7[s5], c3()), P.nextNode(), d3.push({ type: 2, index: ++l3 });
            r6.append(t7[i8], c3());
          }
        }
      } else if (8 === r6.nodeType) if (r6.data === n3) d3.push({ type: 2, index: l3 });
      else {
        let t7 = -1;
        for (; -1 !== (t7 = r6.data.indexOf(o3, t7 + 1)); ) d3.push({ type: 7, index: l3 }), t7 += o3.length - 1;
      }
      l3++;
    }
  }
  static createElement(t6, i7) {
    const s5 = l2.createElement("template");
    return s5.innerHTML = t6, s5;
  }
};
function M(t6, i7, s5 = t6, e6) {
  if (i7 === E) return i7;
  let h4 = void 0 !== e6 ? s5._$Co?.[e6] : s5._$Cl;
  const o6 = a2(i7) ? void 0 : i7._$litDirective$;
  return h4?.constructor !== o6 && (h4?._$AO?.(false), void 0 === o6 ? h4 = void 0 : (h4 = new o6(t6), h4._$AT(t6, s5, e6)), void 0 !== e6 ? (s5._$Co ?? (s5._$Co = []))[e6] = h4 : s5._$Cl = h4), void 0 !== h4 && (i7 = M(t6, h4._$AS(t6, i7.values), h4, e6)), i7;
}
var R = class {
  constructor(t6, i7) {
    this._$AV = [], this._$AN = void 0, this._$AD = t6, this._$AM = i7;
  }
  get parentNode() {
    return this._$AM.parentNode;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  u(t6) {
    const { el: { content: i7 }, parts: s5 } = this._$AD, e6 = (t6?.creationScope ?? l2).importNode(i7, true);
    P.currentNode = e6;
    let h4 = P.nextNode(), o6 = 0, n5 = 0, r6 = s5[0];
    for (; void 0 !== r6; ) {
      if (o6 === r6.index) {
        let i8;
        2 === r6.type ? i8 = new k(h4, h4.nextSibling, this, t6) : 1 === r6.type ? i8 = new r6.ctor(h4, r6.name, r6.strings, this, t6) : 6 === r6.type && (i8 = new Z(h4, this, t6)), this._$AV.push(i8), r6 = s5[++n5];
      }
      o6 !== r6?.index && (h4 = P.nextNode(), o6++);
    }
    return P.currentNode = l2, e6;
  }
  p(t6) {
    let i7 = 0;
    for (const s5 of this._$AV) void 0 !== s5 && (void 0 !== s5.strings ? (s5._$AI(t6, s5, i7), i7 += s5.strings.length - 2) : s5._$AI(t6[i7])), i7++;
  }
};
var k = class _k {
  get _$AU() {
    return this._$AM?._$AU ?? this._$Cv;
  }
  constructor(t6, i7, s5, e6) {
    this.type = 2, this._$AH = A, this._$AN = void 0, this._$AA = t6, this._$AB = i7, this._$AM = s5, this.options = e6, this._$Cv = e6?.isConnected ?? true;
  }
  get parentNode() {
    let t6 = this._$AA.parentNode;
    const i7 = this._$AM;
    return void 0 !== i7 && 11 === t6?.nodeType && (t6 = i7.parentNode), t6;
  }
  get startNode() {
    return this._$AA;
  }
  get endNode() {
    return this._$AB;
  }
  _$AI(t6, i7 = this) {
    t6 = M(this, t6, i7), a2(t6) ? t6 === A || null == t6 || "" === t6 ? (this._$AH !== A && this._$AR(), this._$AH = A) : t6 !== this._$AH && t6 !== E && this._(t6) : void 0 !== t6._$litType$ ? this.$(t6) : void 0 !== t6.nodeType ? this.T(t6) : d2(t6) ? this.k(t6) : this._(t6);
  }
  O(t6) {
    return this._$AA.parentNode.insertBefore(t6, this._$AB);
  }
  T(t6) {
    this._$AH !== t6 && (this._$AR(), this._$AH = this.O(t6));
  }
  _(t6) {
    this._$AH !== A && a2(this._$AH) ? this._$AA.nextSibling.data = t6 : this.T(l2.createTextNode(t6)), this._$AH = t6;
  }
  $(t6) {
    const { values: i7, _$litType$: s5 } = t6, e6 = "number" == typeof s5 ? this._$AC(t6) : (void 0 === s5.el && (s5.el = S2.createElement(V(s5.h, s5.h[0]), this.options)), s5);
    if (this._$AH?._$AD === e6) this._$AH.p(i7);
    else {
      const t7 = new R(e6, this), s6 = t7.u(this.options);
      t7.p(i7), this.T(s6), this._$AH = t7;
    }
  }
  _$AC(t6) {
    let i7 = C.get(t6.strings);
    return void 0 === i7 && C.set(t6.strings, i7 = new S2(t6)), i7;
  }
  k(t6) {
    u2(this._$AH) || (this._$AH = [], this._$AR());
    const i7 = this._$AH;
    let s5, e6 = 0;
    for (const h4 of t6) e6 === i7.length ? i7.push(s5 = new _k(this.O(c3()), this.O(c3()), this, this.options)) : s5 = i7[e6], s5._$AI(h4), e6++;
    e6 < i7.length && (this._$AR(s5 && s5._$AB.nextSibling, e6), i7.length = e6);
  }
  _$AR(t6 = this._$AA.nextSibling, s5) {
    for (this._$AP?.(false, true, s5); t6 !== this._$AB; ) {
      const s6 = i3(t6).nextSibling;
      i3(t6).remove(), t6 = s6;
    }
  }
  setConnected(t6) {
    void 0 === this._$AM && (this._$Cv = t6, this._$AP?.(t6));
  }
};
var H = class {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(t6, i7, s5, e6, h4) {
    this.type = 1, this._$AH = A, this._$AN = void 0, this.element = t6, this.name = i7, this._$AM = e6, this.options = h4, s5.length > 2 || "" !== s5[0] || "" !== s5[1] ? (this._$AH = Array(s5.length - 1).fill(new String()), this.strings = s5) : this._$AH = A;
  }
  _$AI(t6, i7 = this, s5, e6) {
    const h4 = this.strings;
    let o6 = false;
    if (void 0 === h4) t6 = M(this, t6, i7, 0), o6 = !a2(t6) || t6 !== this._$AH && t6 !== E, o6 && (this._$AH = t6);
    else {
      const e7 = t6;
      let n5, r6;
      for (t6 = h4[0], n5 = 0; n5 < h4.length - 1; n5++) r6 = M(this, e7[s5 + n5], i7, n5), r6 === E && (r6 = this._$AH[n5]), o6 || (o6 = !a2(r6) || r6 !== this._$AH[n5]), r6 === A ? t6 = A : t6 !== A && (t6 += (r6 ?? "") + h4[n5 + 1]), this._$AH[n5] = r6;
    }
    o6 && !e6 && this.j(t6);
  }
  j(t6) {
    t6 === A ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, t6 ?? "");
  }
};
var I = class extends H {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(t6) {
    this.element[this.name] = t6 === A ? void 0 : t6;
  }
};
var L = class extends H {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(t6) {
    this.element.toggleAttribute(this.name, !!t6 && t6 !== A);
  }
};
var z = class extends H {
  constructor(t6, i7, s5, e6, h4) {
    super(t6, i7, s5, e6, h4), this.type = 5;
  }
  _$AI(t6, i7 = this) {
    if ((t6 = M(this, t6, i7, 0) ?? A) === E) return;
    const s5 = this._$AH, e6 = t6 === A && s5 !== A || t6.capture !== s5.capture || t6.once !== s5.once || t6.passive !== s5.passive, h4 = t6 !== A && (s5 === A || e6);
    e6 && this.element.removeEventListener(this.name, this, s5), h4 && this.element.addEventListener(this.name, this, t6), this._$AH = t6;
  }
  handleEvent(t6) {
    "function" == typeof this._$AH ? this._$AH.call(this.options?.host ?? this.element, t6) : this._$AH.handleEvent(t6);
  }
};
var Z = class {
  constructor(t6, i7, s5) {
    this.element = t6, this.type = 6, this._$AN = void 0, this._$AM = i7, this.options = s5;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(t6) {
    M(this, t6);
  }
};
var j = { M: h2, P: o3, A: n3, C: 1, L: N, R, D: d2, V: M, I: k, H, N: L, U: z, B: I, F: Z };
var B = t2.litHtmlPolyfillSupport;
B?.(S2, k), (t2.litHtmlVersions ?? (t2.litHtmlVersions = [])).push("3.3.3");
var D = (t6, i7, s5) => {
  const e6 = s5?.renderBefore ?? i7;
  let h4 = e6._$litPart$;
  if (void 0 === h4) {
    const t7 = s5?.renderBefore ?? null;
    e6._$litPart$ = h4 = new k(i7.insertBefore(c3(), t7), t7, void 0, s5 ?? {});
  }
  return h4._$AI(t6), h4;
};

// node_modules/lit-element/lit-element.js
var s3 = globalThis;
var i4 = class extends y {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    var _a;
    const t6 = super.createRenderRoot();
    return (_a = this.renderOptions).renderBefore ?? (_a.renderBefore = t6.firstChild), t6;
  }
  update(t6) {
    const r6 = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(t6), this._$Do = D(r6, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    super.connectedCallback(), this._$Do?.setConnected(true);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._$Do?.setConnected(false);
  }
  render() {
    return E;
  }
};
i4._$litElement$ = true, i4["finalized"] = true, s3.litElementHydrateSupport?.({ LitElement: i4 });
var o4 = s3.litElementPolyfillSupport;
o4?.({ LitElement: i4 });
(s3.litElementVersions ?? (s3.litElementVersions = [])).push("4.2.2");

// node_modules/@lit/reactive-element/decorators/custom-element.js
var t3 = (t6) => (e6, o6) => {
  void 0 !== o6 ? o6.addInitializer(() => {
    customElements.define(t6, e6);
  }) : customElements.define(t6, e6);
};

// node_modules/@lit/reactive-element/decorators/property.js
var o5 = { attribute: true, type: String, converter: u, reflect: false, hasChanged: f };
var r4 = (t6 = o5, e6, r6) => {
  const { kind: n5, metadata: i7 } = r6;
  let s5 = globalThis.litPropertyMetadata.get(i7);
  if (void 0 === s5 && globalThis.litPropertyMetadata.set(i7, s5 = /* @__PURE__ */ new Map()), "setter" === n5 && ((t6 = Object.create(t6)).wrapped = true), s5.set(r6.name, t6), "accessor" === n5) {
    const { name: o6 } = r6;
    return { set(r7) {
      const n6 = e6.get.call(this);
      e6.set.call(this, r7), this.requestUpdate(o6, n6, t6, true, r7);
    }, init(e7) {
      return void 0 !== e7 && this.C(o6, void 0, t6, e7), e7;
    } };
  }
  if ("setter" === n5) {
    const { name: o6 } = r6;
    return function(r7) {
      const n6 = this[o6];
      e6.call(this, r7), this.requestUpdate(o6, n6, t6, true, r7);
    };
  }
  throw Error("Unsupported decorator location: " + n5);
};
function n4(t6) {
  return (e6, o6) => "object" == typeof o6 ? r4(t6, e6, o6) : ((t7, e7, o7) => {
    const r6 = e7.hasOwnProperty(o7);
    return e7.constructor.createProperty(o7, t7), r6 ? Object.getOwnPropertyDescriptor(e7, o7) : void 0;
  })(t6, e6, o6);
}

// node_modules/@lit/reactive-element/decorators/state.js
function r5(r6) {
  return n4({ ...r6, state: true, attribute: false });
}

// node_modules/lit-html/directive.js
var t4 = { ATTRIBUTE: 1, CHILD: 2, PROPERTY: 3, BOOLEAN_ATTRIBUTE: 4, EVENT: 5, ELEMENT: 6 };
var e5 = (t6) => (...e6) => ({ _$litDirective$: t6, values: e6 });
var i5 = class {
  constructor(t6) {
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AT(t6, e6, i7) {
    this._$Ct = t6, this._$AM = e6, this._$Ci = i7;
  }
  _$AS(t6, e6) {
    return this.update(t6, e6);
  }
  update(t6, e6) {
    return this.render(...e6);
  }
};

// node_modules/lit-html/directive-helpers.js
var { I: t5 } = j;
var i6 = (o6) => o6;
var s4 = () => document.createComment("");
var v2 = (o6, n5, e6) => {
  const l3 = o6._$AA.parentNode, d3 = void 0 === n5 ? o6._$AB : n5._$AA;
  if (void 0 === e6) {
    const i7 = l3.insertBefore(s4(), d3), n6 = l3.insertBefore(s4(), d3);
    e6 = new t5(i7, n6, o6, o6.options);
  } else {
    const t6 = e6._$AB.nextSibling, n6 = e6._$AM, c5 = n6 !== o6;
    if (c5) {
      let t7;
      e6._$AQ?.(o6), e6._$AM = o6, void 0 !== e6._$AP && (t7 = o6._$AU) !== n6._$AU && e6._$AP(t7);
    }
    if (t6 !== d3 || c5) {
      let o7 = e6._$AA;
      for (; o7 !== t6; ) {
        const t7 = i6(o7).nextSibling;
        i6(l3).insertBefore(o7, d3), o7 = t7;
      }
    }
  }
  return e6;
};
var u3 = (o6, t6, i7 = o6) => (o6._$AI(t6, i7), o6);
var m2 = {};
var p3 = (o6, t6 = m2) => o6._$AH = t6;
var M2 = (o6) => o6._$AH;
var h3 = (o6) => {
  o6._$AR(), o6._$AA.remove();
};

// node_modules/lit-html/directives/repeat.js
var u4 = (e6, s5, t6) => {
  const r6 = /* @__PURE__ */ new Map();
  for (let l3 = s5; l3 <= t6; l3++) r6.set(e6[l3], l3);
  return r6;
};
var c4 = e5(class extends i5 {
  constructor(e6) {
    if (super(e6), e6.type !== t4.CHILD) throw Error("repeat() can only be used in text expressions");
  }
  dt(e6, s5, t6) {
    let r6;
    void 0 === t6 ? t6 = s5 : void 0 !== s5 && (r6 = s5);
    const l3 = [], o6 = [];
    let i7 = 0;
    for (const s6 of e6) l3[i7] = r6 ? r6(s6, i7) : i7, o6[i7] = t6(s6, i7), i7++;
    return { values: o6, keys: l3 };
  }
  render(e6, s5, t6) {
    return this.dt(e6, s5, t6).values;
  }
  update(s5, [t6, r6, c5]) {
    const d3 = M2(s5), { values: p4, keys: a3 } = this.dt(t6, r6, c5);
    if (!Array.isArray(d3)) return this.ut = a3, p4;
    const h4 = this.ut ?? (this.ut = []), v3 = [];
    let m3, y3, x2 = 0, j2 = d3.length - 1, k2 = 0, w2 = p4.length - 1;
    for (; x2 <= j2 && k2 <= w2; ) if (null === d3[x2]) x2++;
    else if (null === d3[j2]) j2--;
    else if (h4[x2] === a3[k2]) v3[k2] = u3(d3[x2], p4[k2]), x2++, k2++;
    else if (h4[j2] === a3[w2]) v3[w2] = u3(d3[j2], p4[w2]), j2--, w2--;
    else if (h4[x2] === a3[w2]) v3[w2] = u3(d3[x2], p4[w2]), v2(s5, v3[w2 + 1], d3[x2]), x2++, w2--;
    else if (h4[j2] === a3[k2]) v3[k2] = u3(d3[j2], p4[k2]), v2(s5, d3[x2], d3[j2]), j2--, k2++;
    else if (void 0 === m3 && (m3 = u4(a3, k2, w2), y3 = u4(h4, x2, j2)), m3.has(h4[x2])) if (m3.has(h4[j2])) {
      const e6 = y3.get(a3[k2]), t7 = void 0 !== e6 ? d3[e6] : null;
      if (null === t7) {
        const e7 = v2(s5, d3[x2]);
        u3(e7, p4[k2]), v3[k2] = e7;
      } else v3[k2] = u3(t7, p4[k2]), v2(s5, d3[x2], t7), d3[e6] = null;
      k2++;
    } else h3(d3[j2]), j2--;
    else h3(d3[x2]), x2++;
    for (; k2 <= w2; ) {
      const e6 = v2(s5, v3[w2 + 1]);
      u3(e6, p4[k2]), v3[k2++] = e6;
    }
    for (; x2 <= j2; ) {
      const e6 = d3[x2++];
      null !== e6 && h3(e6);
    }
    return this.ut = a3, p3(s5, v3), E;
  }
});

// src/const.ts
var CARD_VERSION = "1.1.1";

// src/localize/languages/en.json
var en_default = {
  common: {
    name: "Lists card",
    description: "Any list an entity holds, such as tasks, events or notices, grouped by time or by a key",
    invalid_configuration: "Invalid configuration. Each entry under lists needs an entity, more entities (entities) are for a calendar's list only, group must be time, key, month or none, limit a whole number, order a list of before, now, after and done, and a tone plain, warning, highlight or dimmed.",
    invalid_layout: "Invalid layout. Layout must be rows or timeline.",
    invalid_text: "Invalid text mode. Text must be full, clamp or fold.",
    invalid_headings: "Invalid headings. Headings must be plain or fold.",
    invalid_height: "Invalid height. The heights (height and max_height) must be positive numbers in pixels, and the height mode (height_mode) auto, fixed or max.",
    invalid_row_step: "Invalid rounding. The rounding (row_step) must be full or half.",
    invalid_editing: "Invalid editing. Editing (editing) must be full, tick or none.",
    no_lists: "No lists yet. Add one in the card's settings.",
    unreadable: "No list found in {entity}.",
    empty: "Nothing on the list.",
    more: "+ {n} more",
    less: "Show less",
    open_source: "Open the source",
    bucket_before: "Earlier",
    bucket_now: "Now",
    bucket_after: "Coming",
    bucket_done: "Ticked",
    mark_done: "Tick",
    mark_open: "Untick",
    add_item: "Add an item",
    edit_item: "Edit",
    edit_title: "Item",
    edit_text: "Description",
    edit_day: "Day",
    edit_time: "Time",
    clear_day: "Clear the day",
    move_up: "Move up",
    move_down: "Move down",
    add: "Add",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    save_failed: "The change didn't go through. Try again.",
    clear_done: "Delete ticked",
    clear_done_ask: "Delete {n} ticked?",
    clear_done_ask_one: "Delete the ticked item?"
  },
  editor: {
    title: "Title",
    icon: "Icon",
    layout: "Layout",
    layout_rows: "Rows",
    layout_timeline: "Timeline, with a date badge",
    text: "An item's text",
    text_helper: "Cut or folded, a tap on the item opens it.",
    text_full: "Shown whole",
    text_clamp: "Cut to two lines",
    text_fold: "Folded away",
    headings: "Group headings",
    headings_plain: "Plain",
    headings_fold: "Foldable",
    editing: "Changing a to-do list on the card",
    editing_full: "Everything",
    editing_tick: "Ticks only",
    editing_none: "Nothing",
    editing_helper: "With ticks only, items can be ticked and unticked, but not added, edited or deleted.",
    lists: "Lists",
    lists_helper: "A card with one list shows that list's groups. With several lists, each list is shown under its own name instead, with no groups inside it.",
    add_list: "Add a list",
    add_list_helper: "Pick the entity whose list is shown. A calendar or a to-do list is read as it is, otherwise the list's keys are set on its page.",
    edit_list: "Edit the list",
    delete_list: "Delete the list",
    move_up: "Move up",
    move_down: "Move down",
    back: "Back",
    entity: "Entity",
    entities: "Other calendars",
    entities_helper: "These calendars' events are shown in the same list, such as the public holidays among your own events. A calendar can have a colour of its own.",
    calendar: "Calendar",
    color: "Colour",
    color_helper: "The colour of the vertical line beside the items. By default the theme's primary colour is used.",
    attribute: "Attribute",
    attribute_helper: "The attribute that holds the list's items. Left empty, the items are read from the entity's state as JSON.",
    path: "Path to the list's items",
    path_helper: "Only when the items are deeper inside the attribute, for example data.items.",
    name: "Name",
    name_helper: "The list's heading on a card with several lists. Left empty, the entity's name is used.",
    fields: "Keys",
    fields_helper: "Which key of a list's item holds each field. A key left empty is the field's own name, and a key may be a path, for example attributes.title.",
    field_title: "Title",
    field_text: "Text",
    field_start: "Date, or a period's start",
    field_end: "A period's end",
    field_label: "Label",
    field_icon: "Icon",
    field_link: "Link",
    field_group: "Group",
    field_id: "Id",
    group: "Groups",
    group_time: "By time",
    group_key: "By the group key",
    group_month: "By month",
    days_back: "Days back",
    days_back_helper: "How many days back items that are over are shown. If the field is empty, no day limit is used.",
    days_back_calendar_helper: "How many days back the events are fetched (max. 365). If the field is empty, the events are fetched from the past year.",
    days_ahead: "Days ahead",
    days_ahead_helper: "How many days ahead items to come are shown. If the field is empty, no day limit is used.",
    days_ahead_calendar_helper: "How many days ahead the events are fetched (max. 365). If the field is empty, the events are fetched a year ahead.",
    group_none: "None, one list",
    limit: "Most items shown",
    limit_helper: "The most items shown, 100 at most. If there are more items than can be shown, the card says how many were left out.",
    past_limit: "Most past items",
    past_limit_helper: "How many items that are over are shown. They count toward the total, and past events are always shown starting from the latest. 0 means no history is shown.",
    hide_more: "Hide how many were left out",
    hide_more_helper: "The list is cut to the set maximum, and how many were left out isn't shown.",
    order: "Time groups shown, in order",
    order_helper: "The items of a group left out aren't shown.",
    order_todo_helper: "The items of a group left out aren't shown. Ticked holds the items ticked on a to-do list.",
    before: "Earlier",
    now: "Now",
    after: "Coming",
    done: "Ticked",
    bucket_name: "Heading",
    bucket_tone: "Tone",
    bucket_days: "Reach in days",
    bucket_days_helper: "Items further away are left out. Left empty, there is no limit in days.",
    bucket_farthest_first: "Furthest from today first",
    bucket_farthest_first_helper: "Usually the items nearest today come first.",
    tone_plain: "Plain",
    tone_warning: "Warning",
    tone_highlight: "Highlight",
    tone_dimmed: "Dimmed",
    empty: "Text of an empty list",
    row_step: "Rounding in a sections view",
    row_step_helper: "On automatic rows the card's height is rounded up to whole rows, or to half rows to save room.",
    row_step_full: "To whole rows",
    row_step_half: "To half rows"
  }
};

// src/localize/languages/fi.json
var fi_default = {
  common: {
    name: "Listakortti",
    description: "Mik\xE4 tahansa entiteetin lista, kuten teht\xE4v\xE4t, tapahtumat tai tiedotteet, ryhmiteltyn\xE4 ajan tai avaimen mukaan",
    invalid_configuration: "Virheelliset asetukset. Jokainen lista kohdassa lists tarvitsee entiteetin (entity), ja muita entiteettej\xE4 (entities) voi olla vain kalenterilistassa. Ryhmittelyn (group) on oltava time, key, month tai none, rajan (limit) kokonaisluku, j\xE4rjestyksen (order) lista arvoista before, now, after ja done, ja s\xE4vyn (tone) plain, warning, highlight tai dimmed.",
    invalid_layout: "Virheellinen asettelu. Asettelun (layout) on oltava rows tai timeline.",
    invalid_text: "Virheellinen tekstin tapa. Tekstin (text) on oltava full, clamp tai fold.",
    invalid_headings: "Virheelliset otsikot. Otsikoiden (headings) on oltava plain tai fold.",
    invalid_height: "Virheellinen korkeus. Korkeuksien (height ja max_height) on oltava positiivisia lukuja pikselein\xE4, ja korkeustilan (height_mode) auto, fixed tai max.",
    invalid_row_step: "Virheellinen py\xF6ristys. Py\xF6ristyksen (row_step) on oltava full tai half.",
    invalid_editing: "Virheellinen muokkaus. Muokkauksen (editing) on oltava full, tick tai none.",
    no_lists: "Ei viel\xE4 listoja. Lis\xE4\xE4 lista kortin asetuksista.",
    unreadable: "Entiteetist\xE4 {entity} ei l\xF6ytynyt listaa.",
    empty: "Lista on tyhj\xE4.",
    more: "+ {n} muuta",
    less: "N\xE4yt\xE4 v\xE4hemm\xE4n",
    open_source: "Avaa l\xE4hde",
    bucket_before: "Aiemmat",
    bucket_now: "Nyt",
    bucket_after: "Tulossa",
    bucket_done: "Merkityt",
    mark_done: "Merkitse",
    mark_open: "Poista merkint\xE4",
    add_item: "Lis\xE4\xE4 rivi",
    edit_item: "Muokkaa",
    edit_title: "Rivi",
    edit_text: "Kuvaus",
    edit_day: "P\xE4iv\xE4",
    edit_time: "Kellonaika",
    clear_day: "Poista p\xE4iv\xE4",
    move_up: "Siirr\xE4 yl\xF6s",
    move_down: "Siirr\xE4 alas",
    add: "Lis\xE4\xE4",
    save: "Tallenna",
    cancel: "Peruuta",
    delete: "Poista",
    save_failed: "Muutos ei mennyt l\xE4pi. Yrit\xE4 uudelleen.",
    clear_done: "Poista merkityt",
    clear_done_ask: "Poistetaanko {n} merkitty\xE4?",
    clear_done_ask_one: "Poistetaanko merkitty rivi?"
  },
  editor: {
    title: "Otsikko",
    icon: "Kuvake",
    layout: "Asettelu",
    layout_rows: "Rivit",
    layout_timeline: "Aikajana, jossa p\xE4iv\xE4 on merkkin\xE4",
    text: "Rivin teksti",
    text_helper: "Katkaistun tai taitetun rivin saa auki napauttamalla.",
    text_full: "N\xE4ytet\xE4\xE4n kokonaan",
    text_clamp: "Katkaistaan kahteen riviin",
    text_fold: "Taitetaan piiloon",
    headings: "Ryhmien otsikot",
    headings_plain: "V\xE4liotsikko",
    headings_fold: "Taittuva",
    editing: "Teht\xE4v\xE4listan muokkaus kortilta",
    editing_full: "Kaikki",
    editing_tick: "Vain rastit",
    editing_none: "Ei mit\xE4\xE4n",
    editing_helper: "Vain rasteilla rivej\xE4 voi merkit\xE4 ja poistaa merkinn\xE4n, mutta ei lis\xE4t\xE4, muokata eik\xE4 poistaa.",
    lists: "Listat",
    lists_helper: "Yhden listan kortti n\xE4ytt\xE4\xE4 listan omat ryhm\xE4t. Kun listoja on useita, jokainen lista n\xE4kyy oman nimens\xE4 alla, eik\xE4 sen sis\xE4ll\xE4 ole ryhmi\xE4.",
    add_list: "Lis\xE4\xE4 lista",
    add_list_helper: "Valitse entiteetti, jonka lista n\xE4ytet\xE4\xE4n. Kortti lukee kalenterin ja teht\xE4v\xE4listan sellaisenaan, muun listan avaimet asetetaan listan omalla sivulla.",
    edit_list: "Muokkaa listaa",
    delete_list: "Poista lista",
    move_up: "Siirr\xE4 yl\xF6s",
    move_down: "Siirr\xE4 alas",
    back: "Takaisin",
    entity: "Entiteetti",
    entities: "Muut kalenterit",
    entities_helper: "N\xE4iden kalenterien tapahtumat n\xE4ytet\xE4\xE4n samassa listassa, esimerkiksi juhlapyh\xE4t omien menojen joukossa. Kalenterille voi m\xE4\xE4ritt\xE4\xE4 oman v\xE4rins\xE4.",
    calendar: "Kalenteri",
    color: "V\xE4ri",
    color_helper: "Rivien vieress\xE4 olevan pystyviivan v\xE4ri. Oletuksena k\xE4ytet\xE4\xE4n teeman p\xE4\xE4v\xE4ri\xE4.",
    attribute: "Attribuutti",
    attribute_helper: "Attribuutti, jossa listan rivit ovat. Tyhj\xE4ksi j\xE4tettyn\xE4 rivit luetaan entiteetin tilasta JSON-muodossa.",
    path: "Polku listan riveihin",
    path_helper: "Vain kun rivit ovat attribuutin sis\xE4ll\xE4 syvemm\xE4ll\xE4, esimerkiksi data.items.",
    name: "Nimi",
    name_helper: "Listan otsikko kortilla, jolla on useita listoja. Tyhj\xE4ksi j\xE4tettyn\xE4 k\xE4ytet\xE4\xE4n entiteetin nime\xE4.",
    fields: "Avaimet",
    fields_helper: "Miss\xE4 listan rivin avaimessa kukin kentt\xE4 on. Tyhj\xE4ksi j\xE4tetty avain on kent\xE4n oma nimi, ja avain voi olla polku, esimerkiksi attributes.title.",
    field_title: "Otsikko",
    field_text: "Teksti",
    field_start: "P\xE4iv\xE4 tai jakson alku",
    field_end: "Jakson loppu",
    field_label: "Nimike",
    field_icon: "Kuvake",
    field_link: "Linkki",
    field_group: "Ryhm\xE4",
    field_id: "Tunniste",
    group: "Ryhm\xE4t",
    group_time: "Ajan mukaan",
    group_key: "Ryhm\xE4n avaimen mukaan",
    group_month: "Kuukausittain",
    days_back: "P\xE4ivi\xE4 taaksep\xE4in",
    days_back_helper: "Kuinka monen p\xE4iv\xE4n takaa menneet rivit n\xE4ytet\xE4\xE4n. Jos kentt\xE4 on tyhj\xE4, p\xE4iv\xE4rajausta ei k\xE4ytet\xE4.",
    days_back_calendar_helper: "Kuinka monen p\xE4iv\xE4n takaa tapahtumat haetaan (enint. 365). Jos kentt\xE4 on tyhj\xE4, tapahtumat haetaan vuoden ajalta.",
    days_ahead: "P\xE4ivi\xE4 eteenp\xE4in",
    days_ahead_helper: "Kuinka monen p\xE4iv\xE4n p\xE4\xE4h\xE4n tulevat rivit n\xE4ytet\xE4\xE4n. Jos kentt\xE4 on tyhj\xE4, p\xE4iv\xE4rajausta ei k\xE4ytet\xE4.",
    days_ahead_calendar_helper: "Kuinka monen p\xE4iv\xE4n p\xE4\xE4h\xE4n tapahtumat haetaan (enint. 365). Jos kentt\xE4 on tyhj\xE4, tapahtumat haetaan vuoden p\xE4\xE4h\xE4n.",
    group_none: "Ei ryhmi\xE4, yksi lista",
    limit: "Rivej\xE4 enint\xE4\xE4n",
    limit_helper: "N\xE4ytett\xE4vien rivien enimm\xE4ism\xE4\xE4r\xE4, korkeintaan 100. Jos rivej\xE4 on enemm\xE4n kuin voidaan n\xE4ytt\xE4\xE4, kortti kertoo montako rajattiin pois.",
    past_limit: "Menneit\xE4 enint\xE4\xE4n",
    past_limit_helper: "Kuinka monta mennytt\xE4 rivi\xE4 n\xE4ytet\xE4\xE4n. Menneet rivit sis\xE4ltyv\xE4t kokonaism\xE4\xE4r\xE4\xE4n, ja menneiden tapahtumien n\xE4ytt\xE4minen aloitetaan aina uusimmasta. 0 tarkoittaa ett\xE4 historiaa ei n\xE4ytet\xE4.",
    hide_more: "Piilota pois j\xE4tettyjen m\xE4\xE4r\xE4",
    hide_more_helper: "Listan pituus rajataan asetettuun enimm\xE4ism\xE4\xE4r\xE4\xE4n, eik\xE4 pois j\xE4tettyjen m\xE4\xE4r\xE4\xE4 n\xE4ytet\xE4.",
    order: "N\xE4ytett\xE4v\xE4t aikaryhm\xE4t j\xE4rjestyksess\xE4",
    order_helper: "Pois j\xE4tetyn ryhm\xE4n rivej\xE4 ei n\xE4ytet\xE4.",
    order_todo_helper: "Pois j\xE4tetyn ryhm\xE4n rivej\xE4 ei n\xE4ytet\xE4. Merkityiss\xE4 ovat teht\xE4v\xE4listan merkityt rivit.",
    before: "Aiemmat",
    now: "Nyt",
    after: "Tulossa",
    done: "Merkityt",
    bucket_name: "Otsikko",
    bucket_tone: "S\xE4vy",
    bucket_days: "Ulottuma p\xE4ivin\xE4",
    bucket_days_helper: "Kauempana olevat rivit j\xE4tet\xE4\xE4n pois. Tyhj\xE4ksi j\xE4tettyn\xE4 p\xE4iv\xE4rajausta ei k\xE4ytet\xE4.",
    bucket_farthest_first: "Kauimmaiset ensin",
    bucket_farthest_first_helper: "Tavallisesti t\xE4t\xE4 p\xE4iv\xE4\xE4 l\xE4himm\xE4t rivit ovat ensin.",
    tone_plain: "Tavallinen",
    tone_warning: "Varoitus",
    tone_highlight: "Korostus",
    tone_dimmed: "Himme\xE4",
    empty: "Tyhj\xE4n listan teksti",
    row_step: "Py\xF6ristys osioihin jaetussa n\xE4kym\xE4ss\xE4",
    row_step_helper: "Automaattisella rivikorkeudella kortin korkeus py\xF6ristet\xE4\xE4n yl\xF6sp\xE4in kokonaisiin riveihin, tai tilan s\xE4\xE4st\xE4miseksi puolikkaisiin riveihin.",
    row_step_full: "Kokonaisiin riveihin",
    row_step_half: "Puolikkaisiin riveihin"
  }
};

// src/localize/localize.ts
var FILES = { "./languages/en.json": en_default, "./languages/fi.json": fi_default };
var LANGUAGES = Object.fromEntries(
  Object.entries(FILES).map(([path, table]) => [path.replace(/^.*\/|\.json$/g, "").toLowerCase(), table])
);
var LANGUAGE_CODES = Object.keys(LANGUAGES).sort();
function translate(language, key) {
  const code = (language ?? "en").split(/[-_]/)[0].toLowerCase();
  return read(LANGUAGES[code], key) ?? read(LANGUAGES.en, key) ?? key;
}
function read(table, key) {
  let value = table;
  for (const part of key.split(".")) {
    if (value === null || typeof value !== "object") {
      return void 0;
    }
    value = value[part];
  }
  return typeof value === "string" ? value : void 0;
}
function browserLanguage() {
  return document.documentElement.lang || navigator.language || "en";
}

// src/types.ts
var LAYOUTS = ["rows", "timeline"];
var TEXT_MODES = ["full", "clamp", "fold"];
var HEADINGS = ["plain", "fold"];
var EDITING = ["full", "tick", "none"];
var GROUPINGS = ["time", "key", "month", "none"];
var BUCKETS = ["before", "now", "after", "done"];
var TONES = ["plain", "warning", "highlight", "dimmed"];
var FIELDS = ["title", "text", "start", "end", "label", "icon", "link", "group", "id"];

// src/lists.ts
var DAY_MS = 864e5;
var MAX_ITEMS = 100;
var MAX_DAYS = 365;
var DEFAULT_TONES = { before: "plain", now: "plain", after: "plain", done: "dimmed" };
function dig(value, path) {
  if (!path) {
    return value;
  }
  for (const part of path.split(".")) {
    if (value === null || typeof value !== "object") {
      return void 0;
    }
    value = value[part];
  }
  return value;
}
function parsed(value) {
  if (typeof value !== "string") {
    return value;
  }
  try {
    return JSON.parse(value);
  } catch {
    return void 0;
  }
}
function parseWhen(value) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? { time: value < 1e11 ? value * 1e3 : value, allDay: false } : void 0;
  }
  if (typeof value !== "string") {
    return void 0;
  }
  const text2 = value.trim();
  const day = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text2) ?? /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(text2);
  if (day) {
    const [year, month, date] = day[1].length === 4 ? [day[1], day[2], day[3]] : [day[3], day[2], day[1]];
    const time2 = Date.UTC(Number(year), Number(month) - 1, Number(date));
    return new Date(time2).getUTCDate() === Number(date) ? { time: time2, allDay: true } : void 0;
  }
  const time = /\d{4}/.test(text2) ? Date.parse(text2) : NaN;
  return Number.isNaN(time) ? void 0 : { time, allDay: false };
}
function plainText(value) {
  if (!/[<&]/.test(value)) {
    return value.replace(/\s+/g, " ").trim();
  }
  const spaced = value.replace(/<\/(p|div|li|h\d|tr)>|<br\s*\/?>/gi, " $&");
  const text2 = new DOMParser().parseFromString(spaced, "text/html").body.textContent ?? "";
  return text2.replace(/\s+/g, " ").trim();
}
function text(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return typeof value === "string" && value.trim() ? value.trim() : void 0;
}
function webLink(value) {
  const link = text(value);
  if (!link) {
    return void 0;
  }
  try {
    return ["http:", "https:"].includes(new URL(link).protocol) ? link : void 0;
  } catch {
    return void 0;
  }
}
function readItem(raw, fields, fallbackId) {
  const source = raw !== null && typeof raw === "object" ? raw : { [fields.title ?? "title"]: raw };
  const field = (name) => dig(source, fields[name] ?? name);
  const title = text(field("title"));
  if (!title) {
    return void 0;
  }
  const item = { key: "", title: plainText(title) };
  const body = text(field("text"));
  if (body) {
    item.text = plainText(body);
  }
  item.start = parseWhen(field("start"));
  item.end = parseWhen(field("end"));
  item.label = text(field("label"));
  item.icon = text(field("icon"));
  item.link = webLink(field("link"));
  item.group = text(field("group"));
  item.key = text(field("id")) ?? fallbackId ?? [item.title, item.start?.time ?? "", item.end?.time ?? ""].join("|");
  return item;
}
function readItems(state, list) {
  if (!state) {
    return void 0;
  }
  const source = dig(parsed(list.attribute ? state.attributes[list.attribute] : state.state), list.path);
  if (source === null || typeof source !== "object") {
    return void 0;
  }
  const fields = list.fields ?? {};
  const items = Array.isArray(source) ? source.map((raw) => readItem(raw, fields, void 0)) : Object.entries(source).map(([id, raw]) => readItem(raw, fields, id));
  const seen = /* @__PURE__ */ new Map();
  return items.filter((item) => item !== void 0).map((item) => {
    const count = seen.get(item.key) ?? 0;
    seen.set(item.key, count + 1);
    return count === 0 ? item : { ...item, key: `${item.key} #${count + 1}` };
  });
}
function isTodoList(list) {
  return list.entity.startsWith("todo.") && !list.attribute;
}
function todoItems(items) {
  return items.filter((todo) => typeof todo.summary === "string" && todo.summary.trim()).map((todo) => {
    const done = todo.status === "completed";
    const item = { key: todo.uid, uid: todo.uid, title: todo.summary.trim(), done };
    if (todo.description?.trim()) {
      item.text = todo.description.trim();
    }
    item.start = parseWhen(done ? todo.completed : todo.due);
    return item;
  });
}
function isCalendarList(list) {
  return list.entity.startsWith("calendar.") && !list.attribute;
}
function calendarEntities(list) {
  return [.../* @__PURE__ */ new Set([list.entity, ...(list.entities ?? []).map(mergedEntity)])];
}
var mergedEntity = (merged) => typeof merged === "string" ? merged : merged.entity;
function colorOf(list, entity) {
  const merged = (list.entities ?? []).find((entry) => typeof entry === "object" && entry.entity === entity);
  return merged?.color || list.color || void 0;
}
var THEME_COLORS = /* @__PURE__ */ new Set([
  "primary",
  "accent",
  "disabled",
  "red",
  "pink",
  "purple",
  "deep-purple",
  "indigo",
  "blue",
  "light-blue",
  "cyan",
  "teal",
  "green",
  "light-green",
  "lime",
  "yellow",
  "amber",
  "orange",
  "deep-orange",
  "brown",
  "light-grey",
  "grey",
  "dark-grey",
  "blue-grey",
  "black",
  "white"
]);
function cssColor(color) {
  if (!color) {
    return void 0;
  }
  return THEME_COLORS.has(color) ? `var(--${color}-color)` : color;
}
var CALENDAR_BACK_DAYS = 365;
var CALENDAR_AHEAD_DAYS = 365;
function calendarWindow(list, now, timeZone) {
  const order = list.order?.length ? list.order : BUCKETS;
  const back = order.includes("before") ? Math.min(list.before?.days ?? CALENDAR_BACK_DAYS, MAX_DAYS) : 0;
  const ahead = order.includes("after") ? Math.min(list.after?.days ?? CALENDAR_AHEAD_DAYS, MAX_DAYS) : 0;
  const today = zoneDay(now, timeZone);
  const iso = (day) => new Date(day * DAY_MS).toISOString();
  return { start: iso(today - back - 1), end: iso(today + ahead + 2) };
}
function calendarItems(events, entity) {
  return events.filter((event) => typeof event.summary === "string" && event.summary.trim()).map((event) => {
    const item = {
      key: [entity, event.uid ?? event.summary, event.recurrence_id ?? event.start].join("|"),
      title: plainText(event.summary)
    };
    if (event.description?.trim()) {
      item.text = plainText(event.description);
    }
    if (event.location?.trim()) {
      item.label = event.location.trim();
    }
    item.start = parseWhen(event.start);
    const end = parseWhen(event.end);
    item.end = end?.allDay ? { time: end.time - DAY_MS, allDay: true } : end;
    if (item.start && item.end && item.end.time < item.start.time) {
      item.end = item.start;
    }
    return item;
  });
}
function limited(placed, list) {
  const total = list.limit ? Math.min(list.limit, MAX_ITEMS) : MAX_ITEMS;
  if (list.past_limit == null) {
    return placed.slice(0, total);
  }
  const end = (entry) => (entry.item.end ?? entry.item.start)?.time ?? 0;
  const past = placed.filter((entry) => entry.item.bucket === "before").sort((a3, b3) => end(b3) - end(a3)).slice(0, Math.min(list.past_limit, total));
  const others = placed.filter((entry) => entry.item.bucket !== "before").slice(0, total - past.length);
  const kept = /* @__PURE__ */ new Set([...past, ...others]);
  return placed.filter((entry) => kept.has(entry));
}
function zoneDay(time, timeZone) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(time);
  const part = (type) => Number(parts.find((p4) => p4.type === type)?.value);
  return Date.UTC(part("year"), part("month") - 1, part("day")) / DAY_MS;
}
var dayOf = (when, timeZone) => when.allDay ? Math.round(when.time / DAY_MS) : zoneDay(when.time, timeZone);
function span(item, timeZone) {
  const start = item.start ?? item.end;
  const end = item.end ?? item.start;
  return start && end ? [dayOf(start, timeZone), dayOf(end, timeZone)] : void 0;
}
function bucketOf(item, today, timeZone) {
  if (item.done) {
    return "done";
  }
  const days = span(item, timeZone);
  if (!days) {
    return "now";
  }
  return days[1] < today ? "before" : days[0] > today ? "after" : "now";
}
function validList(list) {
  const config = list;
  const bucket = (value) => {
    const b3 = value;
    return b3 == null || typeof b3 === "object" && (b3.tone == null || TONES.includes(b3.tone)) && (b3.days == null || count(b3.days)) && (b3.farthest_first == null || typeof b3.farthest_first === "boolean");
  };
  const count = (value) => typeof value === "number" && Number.isInteger(value) && value >= 0;
  const textOrUnset = (value) => value == null || typeof value === "string";
  return config !== null && typeof config === "object" && typeof config.entity === "string" && config.entity !== "" && // More entities are merged only into a calendar's list.
  textOrUnset(config.color) && (config.entities == null || Array.isArray(config.entities) && config.entities.every((entry) => {
    const entity = typeof entry === "object" && entry !== null ? entry.entity : entry;
    const color = typeof entry === "object" && entry !== null ? entry.color : void 0;
    return typeof entity === "string" && entity.startsWith("calendar.") && textOrUnset(color);
  }) && config.entity.startsWith("calendar.") && !config.attribute) && textOrUnset(config.attribute) && textOrUnset(config.path) && textOrUnset(config.name) && textOrUnset(config.empty) && (config.fields == null || typeof config.fields === "object" && Object.values(config.fields).every(textOrUnset)) && (config.group == null || GROUPINGS.includes(config.group)) && (config.limit == null || count(config.limit)) && (config.past_limit == null || count(config.past_limit)) && (config.hide_more == null || typeof config.hide_more === "boolean") && (config.order == null || Array.isArray(config.order) && config.order.every((b3) => BUCKETS.includes(b3))) && bucket(config.before) && bucket(config.now) && bucket(config.after) && bucket(config.done);
}
function arrange(items, list, now, names, {
  timeZone,
  whole = false,
  monthName = (year, month) => `${month + 1}/${year}`
} = {}) {
  const grouping = whole ? "none" : list.group ?? "time";
  const today = zoneDay(now, timeZone);
  const order = list.order?.length ? list.order : BUCKETS;
  const placed = [];
  items.forEach((item, index) => {
    const bucket = bucketOf(item, today, timeZone);
    const days = span(item, timeZone);
    const past = bucket === "before" || bucket === "done";
    const away = !days || bucket === "now" ? 0 : past ? today - days[1] : days[0] - today;
    const reach = list[bucket]?.days;
    if (!order.includes(bucket) || reach != null && away > reach) {
      return;
    }
    const nearest = past && days ? -(item.end ?? item.start).time : (item.start ?? item.end)?.time ?? 0;
    const near = list[bucket]?.farthest_first ? -nearest : nearest;
    const tone = list[bucket]?.tone ?? DEFAULT_TONES[bucket];
    const time = (item.start ?? item.end)?.time ?? 0;
    placed.push({ item: { ...item, bucket, tone }, index, near: days ? near : 0, undated: !days, first: days ? days[0] : 0, time });
  });
  placed.sort(
    grouping === "month" ? (a3, b3) => Number(a3.undated) - Number(b3.undated) || a3.first - b3.first || a3.time - b3.time || a3.index - b3.index : (a3, b3) => order.indexOf(a3.item.bucket) - order.indexOf(b3.item.bucket) || Number(a3.undated) - Number(b3.undated) || a3.near - b3.near || a3.index - b3.index
  );
  const monthOf = new Map(placed.map(({ item, undated, first }) => [item, undated ? void 0 : new Date(first * DAY_MS)]));
  const shown = limited(placed, list).map(({ item }) => item);
  const groups = [];
  if (grouping === "none") {
    groups.push({ key: "all", tone: "plain", items: shown });
  } else {
    for (const item of shown) {
      const month = monthOf.get(item);
      const key = grouping === "time" ? item.bucket : grouping === "month" ? month?.toISOString().slice(0, 7) ?? "" : item.group ?? "";
      let group = groups.find((g2) => g2.key === key);
      if (!group) {
        const name = grouping === "time" ? list[item.bucket]?.name || names[item.bucket] : grouping === "month" ? month && monthName(month.getUTCFullYear(), month.getUTCMonth()) : item.group;
        group = { key, name, tone: grouping === "time" ? item.tone : "plain", items: [] };
        groups.push(group);
      }
      group.items.push(item);
    }
  }
  return { groups: groups.filter((group) => group.items.length > 0), hidden: placed.length - shown.length };
}

// src/height.ts
var HEIGHT_MODES = ["auto", "fixed", "max"];
var pixels = (value) => value == null || typeof value === "number" && Number.isFinite(value) && value > 0;
function validHeight(config) {
  return (config.height_mode == null || HEIGHT_MODES.includes(config.height_mode)) && pixels(config.height) && pixels(config.max_height);
}
function heightMode(config) {
  return config.height_mode ?? (config.height ? "fixed" : config.max_height ? "max" : "auto");
}
var ROW_HEIGHT = 56;
var ROW_GAP = 8;
function heightStyle(config, layout, minimum = 0) {
  const rows = config.grid_options ? config.grid_options.rows : config.layout_options?.grid_rows;
  if (layout === "grid" && typeof rows === "number") {
    return "height: 100%";
  }
  const mode = heightMode(config);
  if (mode === "fixed" && config.height) {
    return `height: ${Math.max(config.height, minimum)}px`;
  }
  return mode === "max" && config.max_height ? `max-height: ${Math.max(config.max_height, minimum)}px` : "";
}
function gridMinRows(minimum) {
  return Math.max(1, Math.ceil((minimum + ROW_GAP) / (ROW_HEIGHT + ROW_GAP)));
}
function heightCardSize(config, content, minimum = 0) {
  const mode = heightMode(config);
  if (mode === "fixed" && config.height) {
    return Math.max(1, Math.round(Math.max(config.height, minimum) / 50));
  }
  return mode === "max" && config.max_height ? Math.max(1, Math.min(content, Math.round(Math.max(config.max_height, minimum) / 50))) : content;
}

// src/rows.ts
var ROW_STEPS = ["full", "half"];
var ROW_PX = 64;
var ROW_GAP_PX = 8;
function validRowStep(config) {
  return config.row_step === void 0 || config.row_step === null || ROW_STEPS.includes(config.row_step);
}
var step = (config) => config.row_step === "half" ? ROW_PX / 2 : ROW_PX;
var SLACK_PX = 0.01;
function drawnScale(card) {
  const layout = Number.parseFloat(getComputedStyle(card).width) || 0;
  const drawn = card.getBoundingClientRect().width;
  return layout > 0 && drawn > 0 ? drawn / layout : 1;
}
function filledHeight(content, config, limit = Infinity) {
  return Math.min(Math.max(1, Math.ceil((content - SLACK_PX + ROW_GAP_PX) / step(config))) * step(config) - ROW_GAP_PX, limit);
}
function spareRoom(filled, content) {
  return Math.max(0, Math.floor(filled - content + SLACK_PX));
}
function heldSpare(held, content) {
  const spare = spareRoom(held, content);
  return spare < ROW_PX ? spare : 0;
}
function fillLimit(config, layout, minimum = 0) {
  const rows = config.grid_options ? config.grid_options.rows : config.layout_options?.grid_rows;
  if (layout !== "grid" || typeof rows === "number") {
    return 0;
  }
  const mode = heightMode(config);
  if (mode === "fixed" && config.height) {
    return 0;
  }
  if (mode !== "max" || !config.max_height) {
    return Infinity;
  }
  const down = Math.floor((config.max_height + ROW_GAP_PX) / step(config)) * step(config) - ROW_GAP_PX;
  return Math.max(down, filledHeight(minimum, config));
}
function filledStyle(config, layout, minimum, filled) {
  const limit = fillLimit(config, layout, minimum);
  if (!limit) {
    return heightStyle(config, layout, minimum);
  }
  return [limit < Infinity && `max-height: ${limit}px`, filled && `min-height: ${filled}px`].filter(Boolean).join("; ");
}
function rowStepSchema(config, text2) {
  if (heightMode(config) === "fixed" && config.height) {
    return [];
  }
  return [
    {
      name: "row_step",
      selector: {
        select: { mode: "dropdown", options: ROW_STEPS.map((value) => ({ value, label: text2(`editor.row_step_${value}`) })) }
      }
    }
  ];
}
function rowStepData(config) {
  return { ...config, row_step: config.row_step ?? "full" };
}
function tidyRowStep(config) {
  const tidied = { ...config };
  if (tidied.row_step !== "half" || heightMode(tidied) === "fixed" && tidied.height) {
    delete tidied.row_step;
  }
  return tidied;
}

// src/editor.ts
var DEFAULTS = { layout: "rows", text: "clamp", headings: "plain", editing: "full" };
var LIST_DEFAULTS = { group: "time" };
var select = (name, values, text2) => ({
  mode: "dropdown",
  options: values.map((value) => ({ value, label: text2(`editor.${name}_${value}`) }))
});
function lookSchema(text2) {
  return [
    {
      type: "grid",
      name: "",
      schema: [
        { name: "title", selector: { text: {} } },
        { name: "icon", selector: { icon: {} } }
      ]
    },
    { name: "layout", selector: { select: select("layout", LAYOUTS, text2) } },
    { name: "text", selector: { select: select("text", TEXT_MODES, text2) } },
    { name: "headings", selector: { select: select("headings", HEADINGS, text2) } },
    { name: "editing", selector: { select: select("editing", EDITING, text2) } }
  ];
}
function listKind(list) {
  const entity = list.entity ?? "";
  if (!list.attribute && entity.startsWith("calendar.")) {
    return "calendar";
  }
  if (!list.attribute && entity.startsWith("todo.")) {
    return "todo";
  }
  return "attribute";
}
var bucketsOf = (kind) => kind === "todo" ? BUCKETS : BUCKETS.filter((bucket) => bucket !== "done");
function notListAttributes(attributes) {
  const holdsList = (value) => {
    if (value !== null && typeof value === "object") {
      return true;
    }
    if (typeof value !== "string" || !/^\s*[[{]/.test(value)) {
      return false;
    }
    try {
      return typeof JSON.parse(value) === "object";
    } catch {
      return false;
    }
  };
  return Object.entries(attributes ?? {}).filter(([, value]) => !holdsList(value)).map(([name]) => name);
}
function listSchema(kind, text2, hiddenAttributes = []) {
  const bucket = (name) => ({
    name,
    selector: {
      object: {
        fields: {
          name: { label: text2("editor.bucket_name"), selector: { text: {} } },
          tone: { label: text2("editor.bucket_tone"), selector: { select: select("tone", TONES, text2) } },
          ...name === "done" ? {
            days: {
              label: text2("editor.bucket_days"),
              description: text2("editor.bucket_days_helper"),
              selector: { number: { min: 0, step: 1, mode: "box" } }
            }
          } : {},
          farthest_first: {
            label: text2("editor.bucket_farthest_first"),
            description: text2("editor.bucket_farthest_first_helper"),
            selector: { boolean: {} }
          }
        }
      }
    }
  });
  const groupings = GROUPINGS.filter((grouping) => grouping !== "key" || kind === "attribute");
  return [
    { name: "entity", required: true, selector: { entity: {} } },
    { name: "color", selector: { ui_color: { default_color: "primary" } } },
    ...kind === "calendar" ? [
      {
        name: "entities",
        selector: {
          object: {
            multiple: true,
            label_field: "entity",
            description_field: "color",
            fields: {
              entity: {
                label: text2("editor.calendar"),
                required: true,
                selector: { entity: { filter: { domain: "calendar" } } }
              },
              color: { label: text2("editor.color"), selector: { ui_color: { default_color: "primary" } } }
            }
          }
        }
      }
    ] : [],
    ...kind === "attribute" ? [
      // Home Assistant's own attribute picker, offering the attributes of the entity picked above.
      {
        name: "attribute",
        selector: { attribute: { hide_attributes: hiddenAttributes } },
        context: { filter_entity: "entity" }
      },
      { name: "path", selector: { text: {} } }
    ] : [],
    { name: "name", selector: { text: {} } },
    ...kind === "attribute" ? [
      {
        name: "fields",
        selector: {
          object: {
            fields: Object.fromEntries(
              FIELDS.map((field) => [field, { label: text2(`editor.field_${field}`), selector: { text: {} } }])
            )
          }
        }
      }
    ] : [],
    { name: "group", selector: { select: select("group", groupings, text2) } },
    {
      type: "grid",
      name: "",
      schema: [
        { name: "days_back", selector: { number: { min: 0, max: MAX_DAYS, step: 1, mode: "box" } } },
        { name: "days_ahead", selector: { number: { min: 0, max: MAX_DAYS, step: 1, mode: "box" } } }
      ]
    },
    {
      type: "grid",
      name: "",
      schema: [
        { name: "limit", selector: { number: { min: 1, max: MAX_ITEMS, step: 1, mode: "box" } } },
        { name: "past_limit", selector: { number: { min: 0, max: MAX_ITEMS, step: 1, mode: "box" } } }
      ]
    },
    { name: "hide_more", selector: { boolean: {} } },
    {
      name: "order",
      selector: {
        select: {
          multiple: true,
          reorder: true,
          options: bucketsOf(kind).map((value) => ({ value, label: text2(`editor.${value}`) }))
        }
      }
    },
    ...bucketsOf(kind).map(bucket),
    { name: "empty", selector: { text: {} } }
  ];
}
var NEW_CALENDAR_DAYS_BACK = 0;
var NEW_CALENDAR_DAYS_AHEAD = 30;
function newList(entity) {
  const list = { entity };
  return listKind(list) === "calendar" ? { ...list, before: { days: NEW_CALENDAR_DAYS_BACK }, after: { days: NEW_CALENDAR_DAYS_AHEAD } } : list;
}
function listFormData(list) {
  const entities = list.entities?.map((entry) => typeof entry === "string" ? { entity: entry } : entry);
  const withoutDays = (bucket) => {
    const rest = { ...list[bucket] ?? {} };
    delete rest.days;
    return Object.keys(rest).length ? rest : void 0;
  };
  return {
    ...LIST_DEFAULTS,
    order: bucketsOf(listKind(list)),
    ...list,
    ...entities ? { entities } : {},
    before: withoutDays("before"),
    after: withoutDays("after"),
    days_back: list.before?.days,
    days_ahead: list.after?.days
  };
}
function listFromForm(value) {
  const {
    days_back: back,
    days_ahead: ahead,
    ...list
  } = value;
  const reach = (bucket, days) => {
    const rest = { ...list[bucket] ?? {} };
    delete rest.days;
    return days == null ? rest : { ...rest, days };
  };
  return { ...list, before: reach("before", back), after: reach("after", ahead) };
}
function formData(config) {
  const set = Object.fromEntries(Object.entries(config).filter(([name, value]) => value != null && name !== "lists"));
  return { ...DEFAULTS, ...set };
}
var blank = (value) => value === void 0 || value === null || value === "" || value === false;
function tidy(value) {
  const entries = Object.entries(value ?? {}).filter(([, v3]) => !blank(v3));
  return entries.length > 0 ? Object.fromEntries(entries) : void 0;
}
function tidyList(list) {
  const tidied = { entity: list.entity };
  for (const key of ["attribute", "path", "name", "color", "empty", "hide_more"]) {
    if (!blank(list[key])) {
      tidied[key] = list[key];
    }
  }
  const entities = (list.entities ?? []).map((entry) => typeof entry === "string" ? { entity: entry } : entry).filter((entry) => entry?.entity && entry.entity !== list.entity).map((entry) => entry.color ? { entity: entry.entity, color: entry.color } : entry.entity);
  if (entities.length > 0) {
    tidied.entities = entities;
  }
  const fields = tidy(list.fields);
  if (fields) {
    tidied.fields = fields;
  }
  if (list.group && list.group !== LIST_DEFAULTS.group) {
    tidied.group = list.group;
  }
  if (list.limit) {
    tidied.limit = list.limit;
  }
  if (list.past_limit != null && list.past_limit !== "") {
    tidied.past_limit = list.past_limit;
  }
  if (list.order?.length && list.order.join() !== BUCKETS.join() && list.order.join() !== bucketsOf(listKind(list)).join()) {
    tidied.order = list.order;
  }
  for (const bucket of BUCKETS) {
    const config = tidy(list[bucket]);
    if (config && !(Object.keys(config).length === 1 && config.tone === DEFAULT_TONES[bucket])) {
      tidied[bucket] = config;
    }
  }
  return tidied;
}
function configFromForm(value) {
  const config = tidyRowStep(value);
  config.lists = (config.lists ?? []).filter((list) => list?.entity).map(tidyList);
  for (const key of ["title", "icon"]) {
    if (!config[key]) {
      delete config[key];
    }
  }
  for (const [key, defaultValue] of Object.entries(DEFAULTS)) {
    if (config[key] === defaultValue || blank(config[key])) {
      delete config[key];
    }
  }
  return config;
}
var KIND_ICONS = {
  calendar: "mdi:calendar",
  todo: "mdi:checkbox-marked-circle-outline",
  attribute: "mdi:format-list-bulleted"
};
var ListsCardEditor = class extends i4 {
  constructor() {
    super(...arguments);
    this.config = { type: "custom:lists-card", lists: [] };
    /** A list added by picking its entity, its page opened at once. */
    this.addList = (event) => {
      const entity = event.detail.value.add_list;
      if (!entity) {
        return;
      }
      const lists = [...this.lists(), newList(entity)];
      this.setLists(lists);
      this.open = lists.length - 1;
    };
    this.valueChanged = (event) => {
      this.emit({ ...this.config, ...event.detail.value, lists: this.lists() });
    };
  }
  setConfig(config) {
    this.config = { ...config };
    if (this.open !== void 0 && this.open >= (config.lists?.length ?? 0)) {
      this.open = void 0;
    }
  }
  render() {
    if (!this.hass) {
      return A;
    }
    const lists = this.config.lists ?? [];
    if (this.open !== void 0 && lists[this.open]) {
      return this.listPage(lists[this.open], this.open);
    }
    const text2 = (key) => this.text(key);
    return b2`
            ${this.form(formData(rowStepData(this.config)), lookSchema(text2), this.valueChanged)}
            <div class="lists">
                <div class="lists-title">${this.text("editor.lists")}</div>
                ${lists.map((list, index) => this.listRow(list, index, lists.length))}
                ${this.form({}, [{ name: "add_list", selector: { entity: {} } }], this.addList)}
                <p class="helper">${this.text("editor.lists_helper")}</p>
            </div>
            ${this.form(formData(rowStepData(this.config)), rowStepSchema(this.config, text2), this.valueChanged)}
        `;
  }
  form(data, schema, changed, kind) {
    const helper = (name) => {
      if (name === "order" && kind === "todo") {
        return this.helper("order_todo");
      }
      if ((name === "days_back" || name === "days_ahead") && kind === "calendar") {
        return this.helper(`${name}_calendar`);
      }
      return this.helper(name);
    };
    return b2`<ha-form
            .hass=${this.hass}
            .data=${data}
            .schema=${schema}
            .computeLabel=${(entry) => this.text(`editor.${entry.name}`)}
            .computeHelper=${(entry) => helper(entry.name)}
            @value-changed=${changed}
        ></ha-form>`;
  }
  /** A list's row: what it reads, its name, and buttons that move it, open its page and delete it. */
  listRow(list, index, count) {
    const state = this.hass?.states[list.entity];
    const name = list.name || state?.attributes.friendly_name || list.entity;
    const button = (icon, label, action, disabled = false) => b2`<button class="icon-button" title=${label} aria-label=${label} ?disabled=${disabled} @click=${action}>
                <ha-icon icon=${icon}></ha-icon>
            </button>`;
    return b2`<div class="list-row">
            <ha-icon class="kind" icon=${KIND_ICONS[listKind(list)]}></ha-icon>
            <div class="list-name">
                <div>${name}</div>
                ${name !== list.entity ? b2`<div class="list-entity">${list.entity}</div>` : A}
            </div>
            ${count > 1 ? b2`${button("mdi:arrow-up", this.text("editor.move_up"), () => this.moveList(index, -1), index === 0)}
                      ${button("mdi:arrow-down", this.text("editor.move_down"), () => this.moveList(index, 1), index === count - 1)}` : A}
            ${button("mdi:pencil", this.text("editor.edit_list"), () => this.open = index)}
            ${button("mdi:delete-outline", this.text("editor.delete_list"), () => this.setLists(this.lists().filter((_2, i7) => i7 !== index)))}
        </div>`;
  }
  /** A list's own page, with the fields its kind can use, and a way back to the card's settings. */
  listPage(list, index) {
    const text2 = (key) => this.text(key);
    const state = this.hass?.states[list.entity];
    const name = list.name || state?.attributes.friendly_name || list.entity;
    const changed = (event) => {
      const lists = this.lists();
      lists[index] = listFromForm(event.detail.value);
      this.setLists(lists);
    };
    return b2`
            <div class="page-head">
                <button
                    class="icon-button"
                    title=${this.text("editor.back")}
                    aria-label=${this.text("editor.back")}
                    @click=${() => this.open = void 0}
                >
                    <ha-icon icon="mdi:arrow-left"></ha-icon>
                </button>
                <ha-icon class="kind" icon=${KIND_ICONS[listKind(list)]}></ha-icon>
                <div class="page-title">${name}</div>
            </div>
            ${this.form(
      listFormData(list),
      listSchema(
        listKind(list),
        text2,
        // The list's own attribute stays on offer even when it holds nothing at the moment.
        notListAttributes(this.hass?.states[list.entity]?.attributes).filter((name2) => name2 !== list.attribute)
      ),
      changed,
      listKind(list)
    )}
        `;
  }
  lists() {
    return [...this.config.lists ?? []];
  }
  moveList(index, by) {
    const lists = this.lists();
    const [list] = lists.splice(index, 1);
    lists.splice(index + by, 0, list);
    this.setLists(lists);
  }
  setLists(lists) {
    this.emit({ ...this.config, lists });
  }
  emit(value) {
    const config = configFromForm(value);
    this.config = config;
    this.dispatchEvent(new CustomEvent("config-changed", { detail: { config }, bubbles: true, composed: true }));
  }
  static get styles() {
    return i`
            ha-form {
                display: block;
                margin-bottom: 16px;
            }

            .helper {
                margin: 4px 0 16px;
                padding: 0 16px;
                color: var(--secondary-text-color);
                font-size: 12px;
            }

            .lists-title {
                margin: 0 0 8px;
                font-weight: 500;
            }

            .list-row {
                display: flex;
                align-items: center;
                gap: 8px;
                min-height: 48px;
                padding: 0 4px 0 12px;
                margin-bottom: 8px;
                border: 1px solid var(--divider-color);
                border-radius: var(--ha-card-border-radius, 12px);
            }

            .kind {
                flex: none;
                color: var(--secondary-text-color);
            }

            .list-name {
                flex: 1 1 auto;
                min-width: 0;
                overflow-wrap: anywhere;
            }

            .list-entity {
                font-size: 12px;
                color: var(--secondary-text-color);
            }

            .icon-button {
                flex: none;
                display: grid;
                place-items: center;
                width: 40px;
                height: 40px;
                padding: 0;
                border: 0;
                border-radius: 50%;
                background: none;
                color: var(--primary-text-color);
                cursor: pointer;
            }

            .icon-button:hover:not(:disabled) {
                background: rgba(var(--rgb-primary-text-color, 33, 33, 33), 0.06);
            }

            .icon-button:disabled {
                opacity: 0.35;
                cursor: default;
            }

            .page-head {
                display: flex;
                align-items: center;
                gap: 8px;
                margin: 0 0 16px -8px;
            }

            .page-title {
                font-size: 18px;
                overflow-wrap: anywhere;
            }
        `;
  }
  text(key) {
    return translate(this.language(), key);
  }
  helper(name) {
    const key = `editor.${name}_helper`;
    const helper = translate(this.language(), key);
    return helper === key ? void 0 : helper;
  }
  language() {
    return this.hass?.locale?.language ?? this.hass?.language ?? browserLanguage();
  }
};
__decorateClass([
  n4({ attribute: false })
], ListsCardEditor.prototype, "hass", 2);
__decorateClass([
  r5()
], ListsCardEditor.prototype, "config", 2);
__decorateClass([
  r5()
], ListsCardEditor.prototype, "open", 2);
ListsCardEditor = __decorateClass([
  t3("lists-card-editor")
], ListsCardEditor);

// src/fade.ts
var fadeStyles = i`
    .fades {
        --fade-length: min(24px, 25%);
        scroll-padding-block: calc(var(--fade-top-offset, 0px) + var(--fade-length, 24px)) var(--fade-length, 24px);
    }

    .fade-top {
        mask-image: linear-gradient(
            to bottom,
            #000 var(--fade-top-offset, 0px),
            transparent var(--fade-top-offset, 0px),
            #000 calc(var(--fade-top-offset, 0px) + var(--fade-length, 24px))
        );
    }

    .fade-bottom {
        mask-image: linear-gradient(to top, transparent, #000 var(--fade-length, 24px));
    }

    .fade-top.fade-bottom {
        mask-image: linear-gradient(
            to bottom,
            #000 var(--fade-top-offset, 0px),
            transparent var(--fade-top-offset, 0px),
            #000 calc(var(--fade-top-offset, 0px) + var(--fade-length, 24px)),
            #000 calc(100% - var(--fade-length, 24px)),
            transparent
        );
    }
`;
function markFade(part) {
  const hidden = part.scrollHeight - part.clientHeight;
  part.classList.toggle("fade-top", hidden > 1 && part.scrollTop > 1);
  part.classList.toggle("fade-bottom", hidden > 1 && hidden - part.scrollTop > 1);
}
var onScroll = (event) => markFade(event.currentTarget);
var ScrollFade = class {
  constructor(host, parts) {
    this.host = host;
    this.parts = parts;
    /** Each followed part with the children whose size it watches. */
    this.followed = /* @__PURE__ */ new Map();
    this.resized = typeof ResizeObserver === "undefined" ? void 0 : new ResizeObserver((entries) => {
      for (const { target } of entries) {
        const part = this.followed.has(target) ? target : target.parentElement;
        if (part && this.followed.has(part)) {
          markFade(part);
        }
      }
    });
    host.addController(this);
  }
  hostConnected() {
    if (this.host.hasUpdated) {
      this.follow();
    }
  }
  hostUpdated() {
    if (this.host.isConnected) {
      this.follow();
    }
  }
  hostDisconnected() {
    for (const part of [...this.followed.keys()]) {
      this.forget(part);
    }
  }
  follow() {
    const now = new Set(this.parts());
    for (const part of [...this.followed.keys()]) {
      if (!now.has(part)) {
        this.forget(part);
      }
    }
    for (const part of now) {
      if (!this.followed.has(part)) {
        part.addEventListener("scroll", onScroll, { passive: true });
        this.resized?.observe(part);
      }
      part.classList.add("fades");
      const before = this.followed.get(part) ?? [];
      const children = [...part.children];
      before.filter((child) => !children.includes(child)).forEach((child) => this.resized?.unobserve(child));
      children.filter((child) => !before.includes(child)).forEach((child) => this.resized?.observe(child));
      this.followed.set(part, children);
      markFade(part);
    }
  }
  forget(part) {
    this.followed.get(part)?.forEach((child) => this.resized?.unobserve(child));
    this.followed.delete(part);
    part.removeEventListener("scroll", onScroll);
    this.resized?.unobserve(part);
    part.classList.remove("fades", "fade-top", "fade-bottom");
  }
};

// src/todo.ts
var TODO_FEATURES = {
  create: 1,
  delete: 2,
  update: 4,
  move: 8,
  dueDate: 16,
  dueDateTime: 32,
  description: 64
};
function hasFeature(features, feature) {
  return (features & TODO_FEATURES[feature]) !== 0;
}
function draftOf(entity, item) {
  const due = item.due ?? "";
  const [day, rest = ""] = due.split("T");
  return { entity, uid: item.uid, title: item.summary, text: item.description ?? "", day, time: rest.slice(0, 5) };
}
function dueData(draft, features, had) {
  if (!draft.day) {
    return had ? { due_date: null } : {};
  }
  const time = hasFeature(features, "dueDateTime") ? draft.time : "";
  if (time || !hasFeature(features, "dueDate")) {
    return { due_datetime: `${draft.day} ${time || "00:00"}:00` };
  }
  return { due_date: draft.day };
}
function saveData(draft, features, before) {
  const data = before ? { item: draft.uid, rename: draft.title.trim() } : { item: draft.title.trim() };
  if (hasFeature(features, "description")) {
    const text2 = draft.text.trim();
    if (text2 || before?.description) {
      data.description = text2;
    }
  }
  if (hasFeature(features, "dueDate") || hasFeature(features, "dueDateTime")) {
    Object.assign(data, dueData(draft, features, Boolean(before?.due)));
  }
  return data;
}
var movable = (item) => !item.due && item.status !== "completed";
function moveTarget(items, uid, direction) {
  const rows = items.filter(movable);
  const at = rows.findIndex((item) => item.uid === uid);
  if (at < 0) {
    return null;
  }
  if (direction === "down") {
    return at + 1 < rows.length ? rows[at + 1].uid : null;
  }
  if (at === 0) {
    return null;
  }
  const above = items.findIndex((item) => item.uid === rows[at - 1].uid);
  return above > 0 ? items[above - 1].uid : void 0;
}

// src/lists-card.ts
var TODO_PREFIX = "todo ";
var todoKey = (entity) => `${TODO_PREFIX}${entity}`;
var calendarKey = (entity, start, end) => `calendar ${entity} ${start} ${end}`;
var TICK_HOLD_MS = 1e3;
var LIST_TOP_PX = 4;
var HEADER_PX = 44;
var HEADING_PX = 24;
var ITEM_PX = 88;
var BORDER_PX = 2;
var LIST_BOTTOM_PX = 12;
var px = (value) => parseFloat(value) || 0;
var CARD_PARTS = [".hd", ".list"].map((part) => `:scope > ${part}`).join(", ");
var ICON_NAME = /^[a-z0-9-]+:[a-z0-9-]+$/i;
function endHeight(part, scale = 1, own = true) {
  if (own && !part.querySelector(".fold")) {
    return part.getBoundingClientRect().height / scale;
  }
  const style = getComputedStyle(part);
  const sideBySide = style.display === "flex" && !style.flexDirection.startsWith("column");
  let height = 0;
  for (const element of part.children) {
    const child = element;
    const childStyle = getComputedStyle(child);
    if (childStyle.position === "absolute") {
      continue;
    }
    let own2;
    if (child.classList.contains("fold")) {
      const content = child.firstElementChild?.firstElementChild;
      own2 = child.classList.contains("open") && content ? endHeight(content, scale) : 0;
    } else {
      own2 = px(childStyle.marginTop) + endHeight(child, scale) + px(childStyle.marginBottom);
    }
    height = sideBySide ? Math.max(height, own2) : height + own2;
  }
  return height + px(style.paddingTop) + px(style.paddingBottom) + px(style.borderTopWidth) + px(style.borderBottomWidth);
}
var ListsCard = class extends i4 {
  constructor() {
    super();
    this.opened = /* @__PURE__ */ new Set();
    this.shut = /* @__PURE__ */ new Set();
    this.cut = /* @__PURE__ */ new Set();
    this.sliding = false;
    this.filled = 0;
    this.spare = 0;
    this.todos = /* @__PURE__ */ new Map();
    this.events = /* @__PURE__ */ new Map();
    this.failed = /* @__PURE__ */ new Set();
    this.ticking = /* @__PURE__ */ new Map();
    this.asking = /* @__PURE__ */ new Set();
    this.expanded = /* @__PURE__ */ new Set();
    this.focusEditor = false;
    this.subscriptions = /* @__PURE__ */ new Map();
    this.tickTimers = /* @__PURE__ */ new Map();
    this.lists = [];
    /** A month's heading in the viewer's language, such as "Marraskuu", with its year when that isn't this one. */
    this.monthName = (year, month) => {
      const thisYear = Number(new Intl.DateTimeFormat("en", { year: "numeric", timeZone: this.timeZone() }).format(Date.now()));
      const options = year === thisYear ? { month: "long" } : { month: "long", year: "numeric" };
      const name = new Intl.DateTimeFormat(this.language(), { ...options, timeZone: "UTC" }).format(Date.UTC(year, month, 1));
      return name.charAt(0).toLocaleUpperCase(this.language()) + name.slice(1);
    };
    /**
     * How wide the buttons on a title's row are at most on the card, in rows: a link's button, and with the texts folded
     * away, the chevron that opens one. Every row makes that room at its end, so the dates end at the same place.
     */
    this.titleButtonsPx = 0;
    this.slid = (event) => {
      const fold = event.target;
      if (event.propertyName !== "grid-template-rows" || !fold.classList?.contains("fold")) {
        return;
      }
      const moving = [...this.renderRoot.querySelectorAll(".fold")].some((f3) => f3 !== fold && (f3.getAnimations?.().length ?? 0) > 0);
      if (!moving) {
        window.clearTimeout(this.slideTimer);
        this.sliding = false;
      }
    };
    new ScrollFade(this, () => this.heightStyle() ? this.renderRoot.querySelectorAll(".list") : []);
  }
  static getConfigElement() {
    return document.createElement("lists-card-editor");
  }
  /** The first entity with a list of objects in an attribute, with the key that looks most like a title, else the first to-do list. */
  static getStubConfig(hass) {
    for (const entity of Object.values(hass?.states ?? {})) {
      for (const [attribute, value] of Object.entries(entity?.attributes ?? {})) {
        const first = Array.isArray(value) ? value[0] : void 0;
        if (!entity || first === null || typeof first !== "object") {
          continue;
        }
        const title = ["title", "name", "summary"].find((key) => typeof first[key] === "string");
        if (title) {
          const list = { entity: entity.entity_id, attribute };
          return { lists: [title === "title" ? list : { ...list, fields: { title } }] };
        }
      }
    }
    const todo = Object.keys(hass?.states ?? {}).find((entity) => entity.startsWith("todo."));
    return { lists: todo ? [{ entity: todo }] : [] };
  }
  setConfig(config) {
    const invalid = (key) => new Error(translate(browserLanguage(), `common.${key}`));
    if (!config || !Array.isArray(config.lists) || !config.lists.every(validList)) {
      throw invalid("invalid_configuration");
    }
    if (config.layout != null && !LAYOUTS.includes(config.layout)) {
      throw invalid("invalid_layout");
    }
    if (config.text != null && !TEXT_MODES.includes(config.text)) {
      throw invalid("invalid_text");
    }
    if (config.headings != null && !HEADINGS.includes(config.headings)) {
      throw invalid("invalid_headings");
    }
    if (!validHeight(config)) {
      throw invalid("invalid_height");
    }
    if (!validRowStep(config)) {
      throw invalid("invalid_row_step");
    }
    if (config.editing != null && !EDITING.includes(config.editing)) {
      throw invalid("invalid_editing");
    }
    this.config = config;
  }
  getCardSize() {
    const items = this.lists.reduce((sum, list) => sum + (list.arranged?.groups.reduce((n5, g2) => n5 + g2.items.length, 0) ?? 0), 0);
    return heightCardSize(this.config ?? {}, 1 + Math.max(1, items), this.minimumHeight());
  }
  getGridOptions() {
    return { columns: 12, min_columns: 6, rows: "auto", min_rows: gridMinRows(this.minimumHeight()) };
  }
  hasHeader() {
    return Boolean(this.config?.title || this.config?.icon || this.addTarget());
  }
  /** The list the header's + adds to: the card's only list, when it is a to-do list that takes new items. */
  addTarget() {
    const lists = this.config?.lists ?? [];
    return lists.length === 1 && isTodoList(lists[0]) && this.can(lists[0], "create") ? lists[0] : void 0;
  }
  minimumHeight() {
    return (this.hasHeader() ? HEADER_PX : 0) + this.listTop() + HEADING_PX + ITEM_PX + LIST_BOTTOM_PX + BORDER_PX;
  }
  /** The list's own room at its top: a little under a header, and as much as at its bottom on a card with none, which is centred. */
  listTop() {
    return this.hasHeader() ? LIST_TOP_PX : LIST_BOTTOM_PX;
  }
  heightStyle() {
    return heightStyle(this.config ?? {}, this.layout, this.minimumHeight());
  }
  layoutMode() {
    return this.config?.layout ?? "rows";
  }
  textMode() {
    return this.config?.text ?? "clamp";
  }
  headings() {
    return this.config?.headings ?? "plain";
  }
  connectedCallback() {
    super.connectedCallback();
    this.resizes = new ResizeObserver(() => this.measureSoon());
    this.watchDay();
    if (this.hasUpdated) {
      this.requestUpdate();
    }
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    window.clearTimeout(this.slideTimer);
    window.clearInterval(this.dayTimer);
    this.sliding = false;
    this.resizes?.disconnect();
    cancelAnimationFrame(this.frame ?? 0);
    this.watchSources();
    this.tickTimers.forEach((timer) => window.clearTimeout(timer));
    this.tickTimers.clear();
    this.ticking = /* @__PURE__ */ new Map();
    this.editing = void 0;
    this.asking = /* @__PURE__ */ new Set();
  }
  /**
   * The subscriptions the card's lists need: each to-do list's items, and each calendar's events over its list's
   * window, which moves with the day. Each is keyed by what it asks, so a changed window is a new subscription.
   */
  wantedSources() {
    const wanted = /* @__PURE__ */ new Map();
    for (const list of this.config?.lists ?? []) {
      if (isTodoList(list)) {
        wanted.set(todoKey(list.entity), { type: "todo/item/subscribe", entity_id: list.entity });
      } else if (isCalendarList(list)) {
        const { start, end } = calendarWindow(list, Date.now(), this.timeZone());
        for (const entity of calendarEntities(list)) {
          wanted.set(calendarKey(entity, start, end), { type: "calendar/event/subscribe", entity_id: entity, start, end });
        }
      }
    }
    return wanted;
  }
  /**
   * Subscribes to what the card's lists need while it is on the page, and lets go of what they no longer do. Home
   * Assistant sends a to-do list's items and a calendar's events whole, at once and on every change.
   */
  watchSources() {
    const connection = this.isConnected ? this.hass?.connection : void 0;
    const wanted = connection ? this.wantedSources() : /* @__PURE__ */ new Map();
    for (const [key, subscription] of this.subscriptions) {
      if (!wanted.has(key)) {
        this.subscriptions.delete(key);
        subscription.then((unsubscribe) => unsubscribe()).catch(() => void 0);
        this.todos.delete(key.slice(TODO_PREFIX.length));
        this.events.delete(key);
        this.failed.delete(key);
      }
    }
    for (const [key, message] of wanted) {
      if (this.subscriptions.has(key)) {
        continue;
      }
      const subscription = connection.subscribeMessage((answer) => {
        if (message.type === "todo/item/subscribe") {
          this.todos = new Map(this.todos).set(message.entity_id, Array.isArray(answer?.items) ? answer.items : []);
        } else {
          this.events = new Map(this.events).set(key, Array.isArray(answer?.events) ? answer.events : []);
        }
      }, message);
      subscription.catch(() => {
        if (this.subscriptions.get(key) === subscription) {
          this.failed = new Set(this.failed).add(key);
        }
      });
      this.subscriptions.set(key, subscription);
    }
  }
  /** The items change buckets when the day does, with no change in any entity, so the card is drawn again then. */
  watchDay() {
    window.clearInterval(this.dayTimer);
    let day = zoneDay(Date.now(), this.timeZone());
    this.dayTimer = window.setInterval(() => {
      const now = zoneDay(Date.now(), this.timeZone());
      if (now !== day) {
        day = now;
        this.requestUpdate();
      }
    }, 6e4);
  }
  shouldUpdate(changed) {
    if (!this.config || !changed.has("hass") || changed.size > 1) {
      return true;
    }
    const previous = changed.get("hass");
    if (!previous || !this.hass) {
      return true;
    }
    if ((previous.locale?.language ?? previous.language) !== (this.hass.locale?.language ?? this.hass.language)) {
      return true;
    }
    return this.config.lists.some(({ entity }) => previous.states[entity] !== this.hass?.states[entity]);
  }
  willUpdate() {
    if (!this.hass || !this.config) {
      return;
    }
    this.watchSources();
    const names = Object.fromEntries(BUCKETS.map((bucket) => [bucket, this.text(`common.bucket_${bucket}`)]));
    const whole = this.config.lists.length > 1;
    this.lists = this.config.lists.map((config, index) => {
      const entity = this.hass?.states[config.entity];
      const name = config.name || entity && this.hass?.formatEntityName?.(entity, [{ type: "device" }, { type: "entity" }]) || entity?.attributes.friendly_name || config.entity;
      const { items, loading } = isTodoList(config) ? {
        items: this.todoItems(config.entity),
        loading: !this.todos.has(config.entity) && !this.failed.has(todoKey(config.entity))
      } : isCalendarList(config) ? this.calendarItems(config) : { items: readItems(entity, config), loading: false };
      const colored = items && !isCalendarList(config) && config.color ? items.map((item) => ({ ...item, color: config.color })) : items;
      const arrangeBy = (list) => colored && arrange(colored, list, Date.now(), names, { timeZone: this.timeZone(), whole, monthName: this.monthName });
      const limited2 = arrangeBy(config);
      const cut = limited2?.hidden ?? 0;
      const open = cut > 0 && !config.hide_more && this.expanded.has(index);
      return {
        config,
        name,
        arranged: open ? arrangeBy({ ...config, limit: 0, past_limit: void 0 }) : limited2,
        loading,
        cut,
        open
      };
    });
  }
  /**
   * A calendar list's events from all its calendars. Until every calendar has answered or failed it is loading, and
   * when none could be read it has no list to show.
   */
  calendarItems(list) {
    const { start, end } = calendarWindow(list, Date.now(), this.timeZone());
    const keys = calendarEntities(list).map((entity) => [entity, calendarKey(entity, start, end)]);
    if (keys.some(([, key]) => !this.events.has(key) && !this.failed.has(key))) {
      return { loading: true };
    }
    const read2 = keys.filter(([, key]) => this.events.has(key));
    return {
      items: read2.length ? read2.flatMap(
        ([entity, key]) => calendarItems(this.events.get(key), entity).map((item) => ({ ...item, color: colorOf(list, entity) }))
      ) : void 0,
      loading: false
    };
  }
  /** A to-do list's items, those just ticked still where they were, or undefined until they have come. */
  todoItems(entity) {
    const raw = this.todos.get(entity);
    return raw && todoItems(raw.map((todo) => this.ticking.get(`${entity} ${todo.uid}`)?.held ?? todo));
  }
  /** Whether the item is shown done: as it was just ticked, or as its list has it. */
  shownDone(list, item) {
    return this.ticking.get(`${list.entity} ${item.uid}`)?.to ?? Boolean(item.done);
  }
  features(entity) {
    return Number(this.hass?.states[entity]?.attributes.supported_features ?? 0);
  }
  /** Whether the card may change a to-do list in this way: the list supports it, and the card isn't read only. */
  /** Whether the card may change a to-do list in this way: the list supports it, and the card is set to change everything. */
  can(list, feature) {
    return (this.config?.editing ?? "full") === "full" && this.supports(list, feature);
  }
  /** Whether an item of the list can be ticked: the card isn't set to change nothing, and the list lets items be changed. */
  canTick(list) {
    return this.config?.editing !== "none" && this.supports(list, "update");
  }
  supports(list, feature) {
    return Boolean(this.hass?.callService) && hasFeature(this.features(list.entity), feature);
  }
  rawItem(entity, uid) {
    return uid === void 0 ? void 0 : this.todos.get(entity)?.find((todo) => todo.uid === uid);
  }
  async callTodo(action, data, entity) {
    await this.hass?.callService?.("todo", action, data, { entity_id: entity });
  }
  /** Opens an item in the editor, or an empty one for a new item, in place of whatever was open. */
  edit(list, item) {
    const raw = this.rawItem(list.entity, item?.uid);
    this.editing = raw ? draftOf(list.entity, raw) : { entity: list.entity, title: "", text: "", day: "", time: "" };
    this.focusEditor = true;
  }
  async save() {
    const draft = this.editing;
    if (!draft?.title.trim()) {
      return;
    }
    const before = this.rawItem(draft.entity, draft.uid);
    try {
      if (draft.uid !== void 0 && !before) {
        throw new Error("The item is gone from its list.");
      }
      await this.callTodo(before ? "update_item" : "add_item", saveData(draft, this.features(draft.entity), before), draft.entity);
      if (this.editing === draft) {
        this.editing = void 0;
      }
    } catch {
      if (this.editing === draft) {
        this.editing = { ...draft, failed: true };
      }
    }
  }
  async deleteItem() {
    const draft = this.editing;
    if (!draft?.uid) {
      return;
    }
    try {
      await this.callTodo("remove_item", { item: [draft.uid] }, draft.entity);
      if (this.editing === draft) {
        this.editing = void 0;
      }
    } catch {
      if (this.editing === draft) {
        this.editing = { ...draft, failed: true };
      }
    }
  }
  /** Moves the open item one row up or down among the items without a date, which the list keeps in its own order. */
  async move(direction) {
    const draft = this.editing;
    const target = draft?.uid ? moveTarget(this.todos.get(draft.entity) ?? [], draft.uid, direction) : null;
    if (!draft || target === null) {
      return;
    }
    try {
      await this.hass?.callWS?.({ type: "todo/item/move", entity_id: draft.entity, uid: draft.uid, previous_uid: target });
    } catch {
      if (this.editing === draft) {
        this.editing = { ...draft, failed: true };
      }
    }
  }
  /** Deletes every done item of the list, once the list has been asked and said yes. */
  async clearDone(list) {
    const done = (this.todos.get(list.entity) ?? []).filter((todo) => todo.status === "completed").map((todo) => todo.uid);
    this.ask(list.entity, false);
    if (done.length > 0) {
      await this.callTodo("remove_item", { item: done }, list.entity).catch(() => void 0);
    }
  }
  ask(entity, on) {
    const asking = new Set(this.asking);
    if (on) {
      asking.add(entity);
    } else {
      asking.delete(entity);
    }
    this.asking = asking;
  }
  /** Ticks an item done, or open again. It is shown so at once, and keeps its place a moment before it moves. */
  async tick(list, item) {
    const key = `${list.entity} ${item.uid}`;
    const current = this.ticking.get(key);
    const held = current?.held ?? this.todos.get(list.entity)?.find((todo) => todo.uid === item.uid);
    if (!held) {
      return;
    }
    const to = !(current?.to ?? Boolean(item.done));
    this.ticking = new Map(this.ticking).set(key, { held, to });
    window.clearTimeout(this.tickTimers.get(key));
    this.tickTimers.set(
      key,
      window.setTimeout(() => this.settle(key), TICK_HOLD_MS)
    );
    try {
      await this.hass?.callService?.(
        "todo",
        "update_item",
        { item: item.uid, status: to ? "completed" : "needs_action" },
        { entity_id: list.entity }
      );
    } catch {
      this.settle(key);
    }
  }
  settle(key) {
    window.clearTimeout(this.tickTimers.get(key));
    this.tickTimers.delete(key);
    const ticking = new Map(this.ticking);
    ticking.delete(key);
    this.ticking = ticking;
  }
  updated() {
    if (!this.isConnected) {
      return;
    }
    const card = this.renderRoot.querySelector("ha-card");
    if (card) {
      this.resizes?.observe(card);
    }
    if (this.focusEditor) {
      this.focusEditor = false;
      this.renderRoot.querySelector(".editor .f-title")?.focus();
    }
    this.measureSoon();
  }
  measureTitleButtons() {
    const fold = this.textMode() === "fold";
    const items = this.lists.flatMap((list) => list.arranged?.groups.flatMap((group) => group.items) ?? []);
    this.titleButtonsPx = this.layoutMode() === "timeline" ? 0 : Math.max(
      0,
      ...items.filter((item) => item.uid === void 0).map((item) => (item.link ? 28 : 0) + (fold && item.text ? 20 : 0))
    );
  }
  render() {
    if (!this.hass || !this.config) {
      return A;
    }
    this.measureTitleButtons();
    const several = this.lists.length > 1;
    return b2`
            <ha-card style=${this.cardStyle()} class=${this.cardClass()} @transitionend=${this.slid}>
                ${this.header()}
                <div class="list">
                    ${this.lists.length === 0 ? b2`<div class="empty">${this.text("common.no_lists")}</div>` : A}
                    ${this.lists.map((list, index) => several ? this.listAsGroup(list, index) : this.listGroups(list, index))}
                </div>
            </ha-card>
        `;
  }
  header() {
    if (!this.hasHeader()) {
      return A;
    }
    const title = this.config?.title ?? "";
    return b2`<div class="hd">
            ${this.config?.icon ? b2`<ha-icon class="hd-icon" icon=${this.config.icon}></ha-icon>` : A}
            <div class="hd-title" title=${title}>${title}</div>
            ${this.pill()} ${this.addButton()}
        </div>`;
  }
  addButton() {
    const list = this.addTarget();
    if (!list) {
      return A;
    }
    return b2`<button
            class="hd-add"
            title=${this.text("common.add_item")}
            aria-label=${this.text("common.add_item")}
            @click=${() => this.edit(list)}
        >
            <ha-icon icon="mdi:plus"></ha-icon>
        </button>`;
  }
  /**
   * Beside the title: how many items the first group has, with its name, when its tone says it matters, as "2 late"
   * does. Otherwise the number of items on the card that aren't done.
   */
  pill() {
    const groups = this.lists.flatMap((list) => list.arranged?.groups ?? []);
    const count = groups.reduce((sum, group) => sum + group.items.filter((item) => item.bucket !== "done").length, 0);
    if (count === 0) {
      return A;
    }
    const lead = this.lists.length === 1 ? groups[0] : void 0;
    if (lead?.name && (lead.tone === "warning" || lead.tone === "highlight")) {
      return b2`<span class="pill tone-${lead.tone}">${lead.items.length} ${lead.name.toLocaleLowerCase(this.language())}</span>`;
    }
    return b2`<span class="pill">${count}</span>`;
  }
  /** One list on the card: its groups are the card's groups. */
  listGroups(list, index) {
    if (list.loading) {
      return A;
    }
    const groups = list.arranged?.groups ?? [];
    const adding = this.newEditor(list.config);
    if (groups.length === 0) {
      return b2`${adding}${adding === A ? b2`<div class="empty">${this.emptyText(list)}</div>` : A}`;
    }
    return b2`${adding}${groups.map((group) => this.group(group, `${index} ${group.key}`, index, this.clearRow(list, group)))}
        ${this.more(list, index)}`;
  }
  /** One of several lists: a group of its own, under its name. */
  listAsGroup(list, index) {
    const items = list.arranged?.groups.flatMap((group2) => group2.items) ?? [];
    const group = { key: "list", name: list.name, tone: "plain", items };
    const empty = list.loading ? A : items.length === 0 ? b2`<div class="empty">${this.emptyText(list)}</div>` : this.more(list, index);
    return this.group(group, `${index} list`, index, b2`${empty}${this.clearRow(list, group)}`);
  }
  emptyText(list) {
    if (!list.arranged) {
      return this.text("common.unreadable", { entity: list.config.entity });
    }
    return list.config.empty || this.text("common.empty");
  }
  /** What the list's limit leaves out, as a row that opens it, and once opened a row that shuts it again. */
  more(list, index) {
    if (list.cut === 0 || list.config.hide_more) {
      return A;
    }
    const toggle = () => {
      const expanded = new Set(this.expanded);
      if (!expanded.delete(index)) {
        expanded.add(index);
      }
      this.expanded = expanded;
    };
    return b2`<button class="more" aria-expanded=${list.open ? "true" : "false"} @click=${toggle}>
            ${list.open ? this.text("common.less") : this.text("common.more", { n: list.cut })}
        </button>`;
  }
  group(group, key, list, rest) {
    const items = b2`<div class="items">
            ${c4(
      group.items,
      (item) => item.key,
      (item) => this.item(item, `${list} ${item.key}`, this.lists[list].config)
    )}
        </div>`;
    if (group.name === void 0) {
      return b2`<div class="grp">${items}${rest}</div>`;
    }
    if (this.headings() === "plain") {
      const clear = group.key === "done" ? this.clearButton(this.lists[list]) : A;
      return b2`<div class="grp">
                <div class="gh"><span class="gh-name" title=${group.name}>${group.name}</span>${clear}</div>
                ${items}${rest}
            </div>`;
    }
    const open = !this.shut.has(key);
    return b2`<div class="grp">
            <button class="gh folding" aria-expanded=${open ? "true" : "false"} @click=${() => this.toggle("shut", key)}>
                <span class="dot tone-${group.tone}"></span>
                <span class="gh-name" title=${group.name}>${group.name}</span>
                <span class="count">${group.items.length}</span>
                <ha-icon class="chev" icon="mdi:chevron-down"></ha-icon>
            </button>
            ${this.fold(open, b2`${items}${rest}`)}
        </div>`;
  }
  item(item, key, list) {
    if (item.uid !== void 0 && this.can(list, "update")) {
      return this.todoItem(item, list);
    }
    const mode = this.textMode();
    const open = this.opened.has(key);
    const can = Boolean(item.text) && (mode === "fold" || mode === "clamp" && (open || this.cut.has(key)));
    const done = item.uid !== void 0 && this.shownDone(list, item);
    const classes = ["item", this.layoutMode(), `tone-${item.tone}`, open && "open", can && "can", done && "done"].filter(Boolean).join(" ");
    const tick = item.uid === void 0 ? A : this.tickBox(list, item, done);
    const cover = can ? b2`<button
                  class="cover"
                  aria-label=${item.title}
                  aria-expanded=${open ? "true" : "false"}
                  @click=${() => this.toggle("opened", key)}
              ></button>` : A;
    const source = item.link ? b2`<a class="src" href=${item.link} target="_blank" rel="noreferrer" title=${this.text("common.open_source")}
                  ><ha-icon icon="mdi:open-in-new"></ha-icon
              ></a>` : A;
    const chevron = item.text && mode !== "full" ? b2`<ha-icon class="chev ${can ? "" : "idle"}" icon="mdi:chevron-down"></ha-icon>` : A;
    const text2 = item.text ? b2`<div class="tx ${mode === "clamp" && !open ? "clamp" : ""}" data-key=${key}>${item.text}</div>` : A;
    const timeline = this.layoutMode() === "timeline";
    const chevronOnTitle = timeline || mode === "fold";
    const titleButtons = [source, chevronOnTitle ? chevron : A].filter((part) => part !== A);
    const actions = titleButtons.length > 0 || !timeline && this.titleButtonsPx > 0 ? b2`<span class="act">${titleButtons}</span>` : A;
    const label = item.label ? b2`<div class="lb" title=${item.label}>${item.label}</div>` : A;
    const when = this.whenText(item);
    if (this.layoutMode() === "timeline") {
      const extra = this.timelineWhen(item);
      const line = item.label || extra ? b2`<div class="lb" title=${[item.label, extra].filter(Boolean).join(" \xB7 ")}>
                          ${item.label ?? A}${item.label && extra ? " \xB7 " : A}${extra ? b2`<span class="when">${extra}</span>` : A}
                      </div>` : A;
      return b2`<div class=${classes}>
                ${cover} ${this.badge(item)}
                <div class="body">
                    <div class="ti" title=${item.title}>${tick}${this.icon(item, "ti-icon")}${item.title}</div>
                    ${line} ${mode === "fold" ? this.fold(open, text2) : text2}
                </div>
                ${actions}
            </div>`;
    }
    const folded = mode === "fold";
    return b2`<div class=${classes}>
            ${cover} ${this.accent(item)}
            <div class="line">
                <span class="ic">${tick === A ? this.icon(item) : tick}</span>
                <span class="ti" title=${item.title}
                    >${item.title}${folded && !open && item.label ? b2`<span class="inl"> · ${item.label}</span>` : A}</span
                >
                ${when ? b2`<span class="when" title=${this.longWhen(item)}>${when}</span>` : A} ${actions}
            </div>
            ${folded ? this.fold(open, b2`<div class="sub">${label}${text2}</div>`) : label !== A || text2 !== A ? b2`<div class="sub">
                            ${label}${chevron === A ? text2 : b2`<div class="tx-row">${text2}${chevron}</div>`}
                        </div>` : A}
        </div>`;
  }
  /**
   * An item of a to-do list the card may change. A tap opens it in the editor, which shows its whole text, so its text
   * is cut to two lines at most and never folded. Open, the editor takes the place of its date and text.
   */
  todoItem(item, list) {
    const editing = this.editing?.entity === list.entity && this.editing.uid === item.uid;
    const done = this.shownDone(list, item);
    const classes = ["item", !editing && "can", this.layoutMode(), `tone-${item.tone}`, done && "done", editing && "editing"].filter(Boolean).join(" ");
    const cover = editing ? A : b2`<button
                  class="cover"
                  aria-label=${`${this.text("common.edit_item")}: ${item.title}`}
                  @click=${() => this.edit(list, item)}
              ></button>`;
    const tick = this.tickBox(list, item, done);
    const text2 = item.text && !editing && this.textMode() !== "fold" ? b2`<div class="tx clamp">${item.text}</div>` : A;
    const when = editing ? "" : this.whenText(item);
    const editor = editing ? this.editor(list) : A;
    if (this.layoutMode() === "timeline") {
      const extra = editing ? "" : this.timelineWhen(item);
      return b2`<div class=${classes}>
                ${cover} ${this.badge(item)}
                <div class="body">
                    <div class="ti" title=${item.title}>${tick}${item.title}</div>
                    ${extra ? b2`<div class="lb"><span class="when">${extra}</span></div>` : A} ${text2} ${editor}
                </div>
            </div>`;
    }
    return b2`<div class=${classes}>
            ${cover} ${this.accent(item)}
            <div class="line">
                <span class="ic">${tick}</span>
                <span class="ti" title=${item.title}>${item.title}</span>
                ${when ? b2`<span class="when" title=${this.longWhen(item)}>${when}</span>` : A}
            </div>
            ${text2 !== A ? b2`<div class="sub">${text2}</div>` : A} ${editor}
        </div>`;
  }
  /** The editor of a new item, at the top of its list. */
  newEditor(list) {
    if (this.editing?.entity !== list.entity || this.editing.uid !== void 0) {
      return A;
    }
    return b2`<div class="item new">${this.editor(list)}</div>`;
  }
  /** The open item's fields, those the list supports, and its buttons. Enter in the title saves, Escape closes it. */
  editor(list) {
    const draft = this.editing;
    const isNew = draft.uid === void 0;
    const set = (field2) => (event) => {
      this.editing = { ...this.editing, [field2]: event.target.value, failed: false };
    };
    const keys = (event) => {
      if (event.key === "Escape") {
        this.editing = void 0;
      } else if (event.key === "Enter" && event.target.classList.contains("f-title")) {
        void this.save();
      }
    };
    const field = (label, input, classes = "") => b2`<label class="field ${classes}"><span>${label}</span>${input}</label>`;
    const text2 = this.can(list, "description") ? field(
      this.text("common.edit_text"),
      b2`<textarea class="f-text" rows="2" .value=${draft.text} @input=${set("text")}></textarea>`
    ) : A;
    const days = this.can(list, "dueDate") || this.can(list, "dueDateTime");
    const day = days ? b2`<div class="when-row">
                  ${field(this.text("common.edit_day"), b2`<input class="f-day" type="date" .value=${draft.day} @input=${set("day")} />`, "grow")}
                  ${this.can(list, "dueDateTime") ? field(
      this.text("common.edit_time"),
      b2`<input class="f-time" type="time" .value=${draft.time} @input=${set("time")} />`
    ) : A}
                  ${draft.day ? b2`<button
                                class="ibtn"
                                title=${this.text("common.clear_day")}
                                aria-label=${this.text("common.clear_day")}
                                @click=${() => this.editing = { ...draft, day: "", time: "" }}
                            >
                                <ha-icon icon="mdi:close"></ha-icon>
                            </button>` : A}
              </div>` : A;
    const raw = this.todos.get(list.entity) ?? [];
    const moves = !isNew && this.can(list, "move") && ["up", "down"].some((d3) => moveTarget(raw, draft.uid, d3) !== null);
    const moveButton = (direction) => b2`<button
                class="ibtn"
                ?disabled=${moveTarget(raw, draft.uid, direction) === null}
                title=${this.text(`common.move_${direction}`)}
                aria-label=${this.text(`common.move_${direction}`)}
                @click=${() => this.move(direction)}
            >
                <ha-icon icon=${direction === "up" ? "mdi:arrow-up" : "mdi:arrow-down"}></ha-icon>
            </button>`;
    return b2`<div class="editor" @keydown=${keys}>
            ${field(this.text("common.edit_title"), b2`<input class="f-title" .value=${draft.title} @input=${set("title")} />`)} ${text2}
            ${day} ${draft.failed ? b2`<div class="failed">${this.text("common.save_failed")}</div>` : A}
            <div class="btns">
                ${!isNew && this.can(list, "delete") ? b2`<button class="tbtn del" @click=${() => this.deleteItem()}>
                              <ha-icon icon="mdi:delete-outline"></ha-icon>${this.text("common.delete")}
                          </button>` : A}
                ${moves ? b2`${moveButton("up")}${moveButton("down")}` : A}
                <span class="sp"></span>
                <button class="tbtn" @click=${() => this.editing = void 0}>${this.text("common.cancel")}</button>
                <button class="tbtn fill" ?disabled=${!draft.title.trim()} @click=${() => this.save()}>
                    ${this.text(isNew ? "common.add" : "common.save")}
                </button>
            </div>
        </div>`;
  }
  /** "Delete done" beside the done group's heading, which asks before it deletes. */
  clearButton(list) {
    if (!list || !isTodoList(list.config) || !this.can(list.config, "delete")) {
      return A;
    }
    const entity = list.config.entity;
    const count = (this.todos.get(entity) ?? []).filter((todo) => todo.status === "completed").length;
    if (count === 0) {
      return A;
    }
    if (!this.asking.has(entity)) {
      return b2`<button class="clear" @click=${() => this.ask(entity, true)}>${this.text("common.clear_done")}</button>`;
    }
    return b2`<span class="asking">
            <span>${this.text(count === 1 ? "common.clear_done_ask_one" : "common.clear_done_ask", { n: count })}</span>
            <button class="clear del" @click=${() => this.clearDone(list.config)}>${this.text("common.delete")}</button>
            <button class="clear" @click=${() => this.ask(entity, false)}>${this.text("common.cancel")}</button>
        </span>`;
  }
  /** "Delete done" as a row of its own, where the done items have no plain heading to sit beside: under foldable headings, or among several lists. */
  clearRow(list, group) {
    const plainDone = this.headings() === "plain" && group.key === "done" && this.lists.length === 1;
    const holdsDone = group.items.some((item) => item.bucket === "done");
    if (plainDone || !holdsDone) {
      return A;
    }
    const button = this.clearButton(list);
    return button === A ? A : b2`<div class="clear-row">${button}</div>`;
  }
  /** The line beside an item, in its list's or calendar's colour, or the theme's primary colour when it has none. */
  accent(item) {
    const color = cssColor(item.color);
    return b2`<span class="acc" style=${color ? `--lc-acc: ${color}` : ""}></span>`;
  }
  /** A to-do item's round tick. On a list that can't be changed it only shows whether the item is done. */
  tickBox(list, item, done) {
    const icon = b2`<ha-icon icon="mdi:check"></ha-icon>`;
    if (!this.canTick(list)) {
      return b2`<span class="tick ${done ? "on" : ""}">${icon}</span>`;
    }
    return b2`<button
            class="tick ${done ? "on" : ""}"
            role="checkbox"
            aria-checked=${done ? "true" : "false"}
            aria-label=${item.title}
            title=${this.text(done ? "common.mark_open" : "common.mark_done")}
            @click=${() => this.tick(list, item)}
        >
            ${icon}
        </button>`;
  }
  icon(item, classes = "") {
    if (!item.icon) {
      return A;
    }
    return ICON_NAME.test(item.icon) ? b2`<ha-icon class=${classes} icon=${item.icon}></ha-icon>` : b2`<span class="emoji ${classes}">${item.icon}</span>`;
  }
  format(when, options) {
    return new Intl.DateTimeFormat(this.language(), { ...options, timeZone: when.allDay ? "UTC" : this.timeZone() });
  }
  year(when) {
    return this.format(when, { year: "numeric" }).format(when.time);
  }
  thisYear() {
    return new Intl.DateTimeFormat(this.language(), { year: "numeric", timeZone: this.timeZone() }).format(Date.now());
  }
  /** The date's parts for a text: day and month, the year when it isn't this one, the time when the date has one. */
  dateOptions(when, ...also) {
    const year = [when, ...also].some((w2) => this.year(w2) !== this.thisYear());
    return {
      day: "numeric",
      month: "numeric",
      ...year ? { year: "numeric" } : {},
      ...when.allDay ? {} : { hour: "numeric", minute: "2-digit" }
    };
  }
  /**
   * When the item is, as a short text: a period as its range, today as "today", a day in a bucket toned as a warning
   * as how long ago it was, and any other day with its weekday.
   */
  whenText(item) {
    const start = item.start ?? item.end;
    if (!start) {
      return "";
    }
    const end = item.start && item.end ? item.end : void 0;
    if (end && (end.time !== start.time || end.allDay !== start.allDay)) {
      const options = this.dateOptions(start, end);
      return this.format(start, start.allDay ? options : { weekday: "short", ...options }).formatRange(start.time, end.time);
    }
    const away = dayOf(start, this.timeZone()) - zoneDay(Date.now(), this.timeZone());
    if (away === 0 || away < 0 && item.tone === "warning") {
      const relative = new Intl.RelativeTimeFormat(this.language(), { numeric: "auto", style: "short" }).format(away, "day");
      return start.allDay || away !== 0 ? relative : `${relative} ${this.format(start, { hour: "numeric", minute: "2-digit" }).format(start.time)}`;
    }
    return this.format(start, { weekday: "short", ...this.dateOptions(start) }).format(start.time);
  }
  longWhen(item) {
    const start = item.start ?? item.end;
    if (!start) {
      return "";
    }
    const options = start.allDay ? { dateStyle: "full" } : { dateStyle: "full", timeStyle: "short" };
    const end = item.start && item.end ? item.end : void 0;
    const format = this.format(start, options);
    return end ? format.formatRange(start.time, end.time) : format.format(start.time);
  }
  sameMonthDays(item) {
    const { start, end } = item;
    return Boolean(
      start?.allDay && end?.allDay && end.time > start.time && this.format(start, { year: "numeric", month: "numeric" }).format(start.time) === this.format(end, { year: "numeric", month: "numeric" }).format(end.time)
    );
  }
  /** A period of whole days that isn't within one month, which the badge writes as its first and last day. */
  acrossMonths(item) {
    const { start, end } = item;
    return Boolean(start?.allDay && end?.allDay && end.time > start.time && !this.sameMonthDays(item));
  }
  /**
   * When the item is, as the timeline writes it under the title: nothing when the badge says it all, and only the time
   * when the item is within the badge's one day, as a meeting from 18 to 19.30 is. A past one in a group toned as a
   * warning still says how long ago it was.
   */
  timelineWhen(item) {
    if (this.badgeSaysIt(item)) {
      return "";
    }
    const start = item.start ?? item.end;
    const end = item.start && item.end ? item.end : void 0;
    const zone = this.timeZone();
    const day = dayOf(start, zone);
    const oneDay = !start.allDay && (!end || !end.allDay && dayOf(end, zone) === day);
    const late = day < zoneDay(Date.now(), zone) && item.tone === "warning";
    if (!oneDay || late) {
      return this.whenText(item);
    }
    const time = this.format(start, { hour: "numeric", minute: "2-digit" });
    return end && end.time !== start.time ? time.formatRange(start.time, end.time) : time.format(start.time);
  }
  /** Whether the timeline's badge already says when the item is, so the text needn't: a plain day, or a period of whole days. */
  badgeSaysIt(item) {
    const start = item.start ?? item.end;
    if (!start) {
      return true;
    }
    if (item.start && item.end && item.end.time !== item.start.time) {
      return this.sameMonthDays(item) || this.acrossMonths(item);
    }
    const away = dayOf(start, this.timeZone()) - zoneDay(Date.now(), this.timeZone());
    return start.allDay && away !== 0 && !(away < 0 && item.tone === "warning");
  }
  /**
   * The day large, or a period's days within one month, the month under it, and the year only when it isn't this
   * year's. A period across months has no one month to stand under, so it is its first and last day, one over the other.
   */
  badge(item) {
    const line = this.accent(item);
    const start = item.start ?? item.end;
    if (!start) {
      return b2`<div class="badge">
                <div class="day">–</div>
                ${line}
            </div>`;
    }
    if (this.acrossMonths(item)) {
      const date = (when) => this.format(when, { day: "numeric", month: "numeric" }).format(when.time);
      const endYear = this.year(item.end);
      return b2`<div class="badge" title=${this.longWhen(item)}>
                <div class="end">${date(start)}</div>
                <div class="end">${date(item.end)}</div>
                ${endYear === this.thisYear() ? A : b2`<div class="year">${endYear}</div>`} ${line}
            </div>`;
    }
    const day = (when) => this.format(when, { day: "numeric" }).format(when.time);
    const days = this.sameMonthDays(item) ? `${day(start)}\u2013${day(item.end)}` : day(start);
    const year = this.year(start);
    return b2`<div class="badge" title=${this.longWhen(item)}>
            <div class="day">${days}</div>
            <div class="month">${this.format(start, { month: "short" }).format(start.time)}</div>
            ${year === this.thisYear() ? A : b2`<div class="year">${year}</div>`} ${line}
        </div>`;
  }
  timeZone() {
    return this.hass?.locale?.time_zone === "server" ? this.hass.config?.time_zone : void 0;
  }
  toggle(which, key) {
    const keys = new Set(this[which]);
    if (!keys.delete(key)) {
      keys.add(key);
    }
    this[which] = keys;
    if (which === "shut" || this.textMode() === "fold") {
      this.sliding = true;
      window.clearTimeout(this.slideTimer);
      this.slideTimer = window.setTimeout(() => this.sliding = false, 1e3);
    }
  }
  /** Content that slides open and shut. A shut one stays in the page, so the change can be animated. */
  fold(isOpen, content) {
    return b2`<div class="fold ${isOpen ? "open" : ""}" ?inert=${!isOpen}>
            <div class="fold-in"><div class="fold-body">${content}</div></div>
        </div>`;
  }
  measureSoon() {
    cancelAnimationFrame(this.frame ?? 0);
    this.frame = requestAnimationFrame(() => {
      if (!this.findCut()) {
        this.fillRows();
      }
    });
  }
  /** Which texts, cut to two lines, have more to show. Only those open on a tap. True when the set changed. */
  findCut() {
    const cut = /* @__PURE__ */ new Set();
    for (const text2 of this.renderRoot.querySelectorAll(".tx.clamp")) {
      if (text2.scrollHeight > text2.clientHeight + 1 && text2.dataset.key) {
        cut.add(text2.dataset.key);
      }
    }
    for (const key of this.opened) {
      if (this.cut.has(key)) {
        cut.add(key);
      }
    }
    if (cut.size === this.cut.size && [...cut].every((key) => this.cut.has(key))) {
      return false;
    }
    this.cut = cut;
    return true;
  }
  fillRows() {
    const card = this.renderRoot.querySelector("ha-card");
    if (!card || !card.clientWidth) {
      return;
    }
    const limit = fillLimit(this.config ?? {}, this.layout, this.minimumHeight());
    const held = !limit && Boolean(heightStyle(this.config ?? {}, this.layout, this.minimumHeight()));
    if (!limit && !held) {
      if (this.filled) this.filled = 0;
      if (this.spare) this.spare = 0;
      return;
    }
    const scale = drawnScale(card);
    const style = getComputedStyle(card);
    let content = px(style.borderTopWidth) + px(style.borderBottomWidth) + px(style.paddingTop) + px(style.paddingBottom);
    for (const part of card.querySelectorAll(CARD_PARTS)) {
      const partStyle = getComputedStyle(part);
      const height = part.classList.contains("list") ? endHeight(part, scale, false) : part.getBoundingClientRect().height / scale;
      content += px(partStyle.marginTop) + height + px(partStyle.marginBottom);
    }
    const list = card.querySelector(":scope > .list");
    if (list) {
      const listStyle = getComputedStyle(list);
      content -= Math.max(0, px(listStyle.paddingTop) - this.listTop()) + Math.max(0, px(listStyle.paddingBottom) - LIST_BOTTOM_PX);
    }
    if (held) {
      const spare2 = heldSpare(card.getBoundingClientRect().height / scale, content);
      if (this.filled) this.filled = 0;
      if (spare2 !== this.spare) this.spare = spare2;
      return;
    }
    const filled = filledHeight(content, this.config ?? {}, limit);
    const spare = spareRoom(filled, content);
    if (filled !== this.filled) {
      this.filled = filled;
    }
    if (spare !== this.spare) {
      this.spare = spare;
    }
  }
  /**
   * The card's inline style: the height it is held to, or the rows it fills up to any limit, with their spare room, or a
   * held card's when it is less than a row. Under a header the room goes between it and the lists. A card with no header
   * is centred instead, the room split so the lists stand as far from the card's top as from its bottom.
   */
  cardStyle() {
    const style = [filledStyle(this.config ?? {}, this.layout, this.minimumHeight(), this.filled)];
    if (this.filled || this.spare) {
      const top = this.hasHeader() ? this.spare : Math.floor(this.spare / 2);
      style.push(`--lc-spare: ${top}px`, `--lc-spare-bottom: ${this.spare - top}px`);
    }
    if (this.titleButtonsPx) {
      style.push(`--lc-title-buttons: ${this.titleButtonsPx}px`);
    }
    return style.filter(Boolean).join("; ");
  }
  cardClass() {
    const icons = this.lists.some((list) => list.arranged?.groups.some((group) => group.items.some((item) => item.icon || item.uid)));
    return [
      this.heightStyle() && "held",
      this.sliding && "sliding",
      !icons && "no-icons",
      this.titleButtonsPx && "rows-buttons",
      !this.hasHeader() && "no-header"
    ].filter(Boolean).join(" ");
  }
  text(key, values = {}) {
    return Object.entries(values).reduce(
      (text2, [name, value]) => text2.replaceAll(`{${name}}`, String(value)),
      translate(this.language(), key)
    );
  }
  language() {
    return this.hass?.locale?.language ?? this.hass?.language ?? browserLanguage();
  }
  static get styles() {
    return [
      i`
                /*
                 * A column, so that with a height of its own, given in the options or by the dashboard's grid, the
                 * header keeps its place and the lists scroll in what is left.
                 */
                ha-card {
                    /* ha-card's own transition covers every property, so a change in the rows filled would animate. Only a slide does. */
                    transition: none;
                    box-sizing: border-box;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    container-type: inline-size;
                    --lc-warning: var(--warning-color, #ffa600);
                    --lc-highlight: var(--success-color, #43a047);
                }

                .hd {
                    flex: none;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 12px 16px 0;
                    min-height: 32px;
                }

                .hd-icon {
                    flex: none;
                    color: var(--state-icon-color);
                }

                .hd-title {
                    flex: 1 1 auto;
                    min-width: 0;
                    font-size: var(--ha-card-header-font-size, 18px);
                    line-height: 1.4;
                }

                .pill {
                    flex: none;
                    font-size: 12px;
                    font-weight: 500;
                    white-space: nowrap;
                    border-radius: 10px;
                    padding: 1px 8px;
                    background: rgba(var(--rgb-primary-text-color, 33, 33, 33), 0.1);
                }

                .pill.tone-warning {
                    background: color-mix(in srgb, var(--lc-warning) 24%, transparent);
                }

                .pill.tone-highlight {
                    background: color-mix(in srgb, var(--lc-highlight) 24%, transparent);
                }

                /* The room a whole row leaves over goes under the header, or above and below the lists on a card with none. */
                .list {
                    flex: 1 1 auto;
                    min-height: 0;
                    padding: calc(4px + var(--lc-spare, 0px)) 0 calc(12px + var(--lc-spare-bottom, 0px));
                }

                .grp + .grp {
                    border-top: 1px solid var(--divider-color, rgba(0, 0, 0, 0.12));
                    margin-top: 4px;
                }

                .gh {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    box-sizing: border-box;
                    width: 100%;
                    padding: 6px 16px 2px;
                    font: inherit;
                    font-size: 11px;
                    font-weight: 500;
                    line-height: 16px;
                    letter-spacing: 0.08em;
                    text-transform: uppercase;
                    text-align: start;
                    color: var(--secondary-text-color);
                    background: none;
                    border: 0;
                    overflow-wrap: anywhere;
                }

                .gh.folding {
                    min-height: 36px;
                    padding: 4px 12px 4px 16px;
                    font-size: 14px;
                    line-height: 20px;
                    letter-spacing: normal;
                    text-transform: none;
                    color: var(--primary-text-color);
                    cursor: pointer;
                }

                .gh-name {
                    flex: 1 1 auto;
                    min-width: 0;
                }

                .count {
                    flex: none;
                    font-size: 12px;
                    font-weight: 400;
                    color: var(--secondary-text-color);
                }

                .dot {
                    flex: none;
                    width: 8px;
                    height: 8px;
                    border-radius: 2px;
                    background: var(--secondary-text-color);
                }

                .dot.tone-warning {
                    background: var(--lc-warning);
                }

                .dot.tone-highlight {
                    background: var(--lc-highlight);
                }

                .dot.tone-dimmed {
                    opacity: 0.5;
                }

                .chev {
                    flex: none;
                    --mdc-icon-size: 20px;
                    color: var(--secondary-text-color);
                    transition: transform var(--ha-animation-duration-normal, 250ms) ease;
                }

                .gh[aria-expanded="false"] .chev {
                    transform: rotate(-90deg);
                }

                .item.open .act .chev {
                    transform: rotate(180deg);
                }

                .chev.idle {
                    visibility: hidden;
                }

                .item {
                    position: relative;
                    padding: 4px 16px;
                }

                /* The tap that opens an item covers it, and its texts let the tap through. The source link lies over it. */
                .cover {
                    position: absolute;
                    inset: 0;
                    width: 100%;
                    padding: 0;
                    border: 0;
                    background: none;
                    cursor: pointer;
                }

                .cover:focus-visible {
                    outline: 2px solid var(--primary-color);
                    outline-offset: -2px;
                    border-radius: 4px;
                }

                .item.can > :not(.cover) {
                    pointer-events: none;
                }

                .item .src,
                .item .tick,
                .item .editor {
                    pointer-events: auto;
                }

                .tone-dimmed > :not(.cover) {
                    opacity: 0.6;
                }

                /*
                 * A dimmed badge stays solid and dims its texts, or the timeline's line would show through it. An open
                 * editor isn't dimmed either. Both rules are as strong as the one above, so they win by coming after it.
                 */
                .tone-dimmed > .badge,
                .tone-dimmed > .editor {
                    opacity: 1;
                }

                /* In the timeline the editor is inside the item's body, which an open item leaves undimmed. */
                .tone-dimmed.editing > .body {
                    opacity: 1;
                }

                .tone-dimmed > .badge > * {
                    opacity: 0.6;
                }

                /* The date and the buttons go to a line of their own when the title has too little room beside them. */
                .line {
                    display: flex;
                    flex-wrap: wrap;
                    justify-content: flex-end;
                    align-items: flex-start;
                    gap: 0 10px;
                    min-height: 24px;
                }

                .ic {
                    flex: none;
                    width: 24px;
                    line-height: 24px;
                    text-align: center;
                    color: var(--state-icon-color);
                    --mdc-icon-size: 20px;
                }

                .emoji {
                    font-size: 17px;
                }

                .no-icons .ic {
                    display: none;
                }

                .no-icons .sub {
                    padding-left: 0;
                }

                .ti {
                    flex: 1 1 130px;
                    min-width: 0;
                    font-weight: 500;
                    line-height: 20px;
                    padding: 2px 0;
                    overflow-wrap: anywhere;
                }

                .inl {
                    font-weight: 400;
                    font-size: 12px;
                    color: var(--secondary-text-color);
                }

                .when {
                    flex: none;
                    font-size: 12px;
                    line-height: 24px;
                    white-space: nowrap;
                    color: var(--secondary-text-color);
                }

                .tone-warning .when {
                    color: var(--lc-warning);
                }

                .tone-highlight .when {
                    color: var(--lc-highlight);
                }

                /* The buttons' icons are smaller than the buttons, so the row is pulled out until the last icon ends where the texts do. */
                .act {
                    flex: none;
                    display: flex;
                    justify-content: flex-end;
                    align-items: center;
                    height: 24px;
                    margin-right: -5px;
                }

                .rows-buttons .line > .act {
                    min-width: var(--lc-title-buttons);
                }

                /* A text cut to two lines, with the chevron that opens it at the end of its row. */
                .tx-row {
                    display: flex;
                    align-items: flex-start;
                    gap: 8px;
                }

                .tx-row > .tx {
                    flex: 1 1 auto;
                    min-width: 0;
                }

                .src {
                    position: relative;
                    display: grid;
                    place-items: center;
                    width: 28px;
                    height: 28px;
                    margin: -2px 0;
                    border-radius: 50%;
                    color: var(--secondary-text-color);
                    --mdc-icon-size: 18px;
                }

                /* A to-do item's tick: a ring, filled in the highlight colour once done. It lies over the tap that opens the item. */
                .tick {
                    position: relative;
                    flex: none;
                    box-sizing: border-box;
                    display: inline-grid;
                    place-items: center;
                    width: 20px;
                    height: 20px;
                    margin: 2px;
                    padding: 0;
                    border: 2px solid var(--secondary-text-color);
                    border-radius: 50%;
                    background: none;
                    color: var(--card-background-color, #fff);
                    font: inherit;
                    vertical-align: top;
                    --mdc-icon-size: 15px;
                    /* The rows' 24 px line height would make the icon's box taller than the ring and sink the check to its bottom. */
                    line-height: 0;
                }

                button.tick {
                    cursor: pointer;
                }

                button.tick:focus-visible {
                    outline: 2px solid var(--primary-color);
                    outline-offset: 2px;
                }

                .tick ha-icon {
                    display: flex;
                    visibility: hidden;
                }

                .tick.on {
                    border-color: var(--lc-highlight);
                    background: var(--lc-highlight);
                }

                .tick.on ha-icon {
                    visibility: visible;
                }

                /* In the timeline the tick is before the title, in its line's height. */
                .timeline .ti .tick {
                    margin: -2px 8px -2px 0;
                }

                .done .ti {
                    text-decoration: line-through;
                }

                /* The header's +, its icon ending where the pill's text does, as the item buttons' icons do. */
                .hd-add {
                    flex: none;
                    display: grid;
                    place-items: center;
                    width: 32px;
                    height: 32px;
                    margin: -4px -9px -4px -6px;
                    padding: 0;
                    border: 0;
                    border-radius: 50%;
                    background: none;
                    color: var(--secondary-text-color);
                    cursor: pointer;
                }

                .hd-add:hover,
                .ibtn:hover:not(:disabled) {
                    background: rgba(var(--rgb-primary-text-color, 33, 33, 33), 0.06);
                    color: var(--primary-color);
                }

                /* The editor, under an item's title, or at the top of the list for a new item. */
                .editor {
                    position: relative;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    padding: 8px 0 6px 34px;
                }

                .timeline .editor,
                .no-icons .editor {
                    padding-left: 0;
                }

                .item.new {
                    padding-top: 0;
                }

                .field {
                    display: flex;
                    flex-direction: column;
                    gap: 3px;
                    min-width: 0;
                    font-size: 11px;
                    color: var(--secondary-text-color);
                }

                .field input,
                .field textarea {
                    box-sizing: border-box;
                    width: 100%;
                    min-width: 0;
                    padding: 7px 10px;
                    font: inherit;
                    font-size: 14px;
                    color: var(--primary-text-color);
                    background: var(--input-fill-color, rgba(var(--rgb-primary-text-color, 33, 33, 33), 0.06));
                    border: 0;
                    border-bottom: 1px solid var(--secondary-text-color);
                    border-radius: 4px 4px 0 0;
                    outline: none;
                    color-scheme: inherit;
                }

                .field input:focus,
                .field textarea:focus {
                    border-bottom: 2px solid var(--primary-color);
                    padding-bottom: 6px;
                }

                .field textarea {
                    resize: vertical;
                    line-height: 18px;
                }

                .when-row {
                    display: flex;
                    align-items: flex-end;
                    gap: 8px;
                }

                .when-row .grow {
                    flex: 1 1 auto;
                }

                .when-row .ibtn {
                    margin-bottom: 2px;
                }

                .failed {
                    font-size: 13px;
                    color: var(--error-color, #db4437);
                }

                .btns {
                    display: flex;
                    flex-wrap: wrap;
                    align-items: center;
                    gap: 4px;
                    margin-right: -5px;
                }

                .btns .sp {
                    flex: 1 1 auto;
                }

                .tbtn {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    padding: 6px 12px;
                    font: inherit;
                    font-size: 14px;
                    font-weight: 500;
                    color: var(--primary-color);
                    background: none;
                    border: 0;
                    border-radius: 16px;
                    cursor: pointer;
                    --mdc-icon-size: 18px;
                }

                .tbtn.fill {
                    color: var(--text-primary-color, #fff);
                    background: var(--primary-color);
                }

                .tbtn:disabled {
                    opacity: 0.5;
                    cursor: default;
                }

                .tbtn.del {
                    padding-left: 0;
                    color: var(--error-color, #db4437);
                }

                .ibtn {
                    display: grid;
                    place-items: center;
                    width: 32px;
                    height: 32px;
                    padding: 0;
                    border: 0;
                    border-radius: 50%;
                    background: none;
                    color: var(--secondary-text-color);
                    cursor: pointer;
                    --mdc-icon-size: 20px;
                }

                .ibtn:disabled {
                    opacity: 0.35;
                    cursor: default;
                }

                /* "Delete done", beside the done group's heading or on a row of its own, and its question. */
                .clear {
                    flex: none;
                    padding: 0;
                    font: inherit;
                    font-size: 12px;
                    font-weight: 400;
                    letter-spacing: normal;
                    text-transform: none;
                    color: var(--primary-color);
                    background: none;
                    border: 0;
                    cursor: pointer;
                }

                .clear:hover {
                    text-decoration: underline;
                }

                .clear.del {
                    font-weight: 500;
                    color: var(--error-color, #db4437);
                }

                .asking {
                    flex: none;
                    display: flex;
                    gap: 10px;
                    font-size: 12px;
                    font-weight: 400;
                    letter-spacing: normal;
                    text-transform: none;
                }

                .clear-row {
                    display: flex;
                    justify-content: flex-end;
                    padding: 2px 16px;
                }

                .src:hover {
                    background: rgba(var(--rgb-primary-text-color, 33, 33, 33), 0.06);
                    color: var(--primary-color);
                }

                .sub {
                    padding: 0 0 0 34px;
                }

                .lb {
                    font-size: 12px;
                    line-height: 16px;
                    color: var(--secondary-text-color);
                    overflow-wrap: anywhere;
                }

                .tx {
                    font-size: 13px;
                    line-height: 18px;
                    color: var(--secondary-text-color);
                    overflow-wrap: anywhere;
                }

                .tx.clamp {
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }

                /* The timeline: a date badge, with a line running from each badge to the next. */
                .item.timeline {
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                    padding-top: 0;
                    padding-bottom: 0;
                }

                /*
                 * The line beside an item, 12 px from what is on each side of it: the card's padding edge and the item's
                 * icon or title in rows, the badge and the text in the timeline, where it is as tall as the badge. It is
                 * placed absolutely, as a line stretched by the item would be measured at the item's height while a
                 * fold slides.
                 */
                .acc {
                    position: absolute;
                    width: 2px;
                    border-radius: 999px;
                    background: var(--lc-acc, var(--primary-color));
                    pointer-events: none;
                }

                .item.rows {
                    padding-left: 30px;
                }

                .item.rows > .acc {
                    left: 16px;
                    top: 6px;
                    bottom: 6px;
                }

                .item.timeline > .body {
                    margin-left: 14px;
                }

                .badge > .acc {
                    left: calc(100% + 12px);
                    top: 0;
                    bottom: 0;
                }

                .badge {
                    flex: none;
                    position: relative;
                    width: 52px;
                    /* Whole pixels, as its lines alone come to 35.75, and the items beside a title alone would end a fraction short. */
                    min-height: 36px;
                    box-sizing: border-box;
                    margin: 7px 0;
                    text-align: center;
                    border-radius: 6px;
                    padding: 4px 0 3px;
                    line-height: 1.15;
                    background: var(--card-background-color, #fff);
                    box-shadow: inset 0 0 0 1px var(--divider-color, rgba(0, 0, 0, 0.12));
                }

                .tone-warning .badge {
                    box-shadow: inset 0 0 0 1.5px var(--lc-warning);
                }

                .tone-highlight .badge {
                    box-shadow: inset 0 0 0 1.5px var(--lc-highlight);
                }

                .day {
                    font-size: 15px;
                    font-weight: 500;
                    white-space: nowrap;
                }

                .end {
                    font-size: 12px;
                    font-weight: 500;
                    line-height: 1.25;
                    white-space: nowrap;
                }

                .month,
                .year {
                    font-size: 10px;
                    text-transform: uppercase;
                    letter-spacing: 0.04em;
                    color: var(--secondary-text-color);
                }

                /* A year is shown only when it isn't this one, and stands out, so a date a year old isn't read as this year's. */
                .year {
                    color: var(--lc-warning);
                }

                /*
                 * The title and the line under it stand centred against a badge of two lines, 36 px tall from 7 px down,
                 * so an item of one or two lines is 50 px tall, whatever its second line is, and the badges stand at
                 * even gaps. Anything more flows on below them. A title alone is centred against the badge by itself,
                 * as is a title with its text folded away. A description's line is 2 px taller than a time's, so the
                 * pair starts a pixel higher.
                 */
                .body {
                    flex: 1 1 auto;
                    min-width: 0;
                    padding: 7px 0;
                }

                .timeline .body:has(> .ti:only-child),
                .timeline .body:has(> .ti + .fold:not(.open):last-child) {
                    padding-top: 15px;
                }

                .timeline .body:has(> .ti + .tx) {
                    padding-top: 6px;
                    padding-bottom: 6px;
                }

                .timeline .ti {
                    padding: 0;
                }

                .ti-icon {
                    margin-right: 5px;
                    --mdc-icon-size: 18px;
                    color: var(--state-icon-color);
                }

                .timeline .act {
                    margin-top: 6px;
                }

                .timeline .lb .when {
                    line-height: inherit;
                }

                .more,
                .empty {
                    padding: 4px 16px 2px;
                    font-size: 12px;
                    color: var(--secondary-text-color);
                }

                .empty {
                    font-size: 13px;
                    padding-top: 8px;
                }

                /* The row of what the limit leaves out is a button that opens it, looking like the row it was. */
                button.more {
                    display: block;
                    width: 100%;
                    margin: 0;
                    border: 0;
                    background: none;
                    font: inherit;
                    font-size: 12px;
                    text-align: start;
                    cursor: pointer;
                }

                button.more:hover {
                    color: var(--primary-color);
                }

                button.more:focus-visible {
                    outline: 2px solid var(--primary-color);
                    outline-offset: -2px;
                    border-radius: 4px;
                }

                .fold {
                    display: grid;
                    grid-template-rows: 0fr;
                    transition: grid-template-rows var(--ha-animation-duration-normal, 250ms) ease;
                }

                .fold.open {
                    grid-template-rows: 1fr;
                }

                .fold-in {
                    min-height: 0;
                    overflow: hidden;
                }

                /* Held to a height, the header keeps to one line and the lists scroll, measured the same whether they do or not. */
                .held .hd-title,
                .held .ti,
                .held .lb,
                .held .gh-name {
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .held .line {
                    flex-wrap: nowrap;
                }

                .held .ti {
                    flex-basis: 0;
                }

                /* The lists scroll with no scrollbar. Their fading edges show that there is more. */
                .held .list {
                    overflow-y: auto;
                    scrollbar-width: none;
                }

                .held .list::-webkit-scrollbar {
                    display: none;
                }

                /* A card with no header has as much room above its lists as below them. */
                .no-header > .list {
                    padding-top: calc(12px + var(--lc-spare, 0px));
                }

                .sliding.held .list {
                    overflow-y: hidden;
                }

                /* The rows the card fills, and the spare room above the lists, change along with a slide, not on ha-card's own timing. */
                ha-card.sliding {
                    transition: min-height var(--ha-animation-duration-normal, 250ms) ease;
                }

                ha-card.sliding > .list {
                    transition: padding var(--ha-animation-duration-normal, 250ms) ease;
                }

                @media (prefers-reduced-motion: reduce) {
                    .fold,
                    .chev,
                    ha-card.sliding,
                    ha-card.sliding > .list {
                        transition: none;
                    }
                }
            `,
      fadeStyles
    ];
  }
};
__decorateClass([
  n4({ attribute: false })
], ListsCard.prototype, "hass", 2);
__decorateClass([
  n4({ attribute: false })
], ListsCard.prototype, "layout", 2);
__decorateClass([
  r5()
], ListsCard.prototype, "config", 2);
__decorateClass([
  r5()
], ListsCard.prototype, "opened", 2);
__decorateClass([
  r5()
], ListsCard.prototype, "shut", 2);
__decorateClass([
  r5()
], ListsCard.prototype, "cut", 2);
__decorateClass([
  r5()
], ListsCard.prototype, "sliding", 2);
__decorateClass([
  r5()
], ListsCard.prototype, "filled", 2);
__decorateClass([
  r5()
], ListsCard.prototype, "spare", 2);
__decorateClass([
  r5()
], ListsCard.prototype, "todos", 2);
__decorateClass([
  r5()
], ListsCard.prototype, "events", 2);
__decorateClass([
  r5()
], ListsCard.prototype, "failed", 2);
__decorateClass([
  r5()
], ListsCard.prototype, "ticking", 2);
__decorateClass([
  r5()
], ListsCard.prototype, "editing", 2);
__decorateClass([
  r5()
], ListsCard.prototype, "asking", 2);
__decorateClass([
  r5()
], ListsCard.prototype, "expanded", 2);
if (!customElements.get("lists-card")) {
  customElements.define("lists-card", ListsCard);
  console.info(
    `%c  LISTS-CARD 
%c  ${CARD_VERSION}    `,
    "color: orange; font-weight: bold; background: black",
    "color: white; font-weight: bold; background: dimgray"
  );
  const registry = window;
  registry.customCards = registry.customCards ?? [];
  registry.customCards.push({
    type: "lists-card",
    name: translate(browserLanguage(), "common.name"),
    description: translate(browserLanguage(), "common.description"),
    documentationURL: "https://github.com/jesmak/lists-card",
    preview: true
  });
}
export {
  ListsCard,
  endHeight
};
