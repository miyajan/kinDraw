const states = new WeakMap<DrawCanvasElement, DrawState>();
const histories = new WeakMap<DrawCanvasElement, DrawHistory>();

type Point = [number, number];
type Color = string;
type Size = number;
type Width = string;
type Height = string;

interface DrawState {
  drawing: boolean;
  color: Color;
  bgcolor: Color;
  size: Size;
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  width: Width;
  height: Height;
  lastX: number | null;
  lastY: number | null;
}

type Line = [Point, Point, Color, Size];
type DrawStepFunction = (el: DrawCanvasElement) => void;

interface DrawHistory {
  log: Array<Line[] | DrawStepFunction>;
  currentEntry: Line[];
  currentStep: number;
}

export class DrawCanvasElement extends HTMLElement {
  constructor() {
    super();

    const shadowRoot = this.attachShadow({ mode: "open" });
    shadowRoot.innerHTML = `<canvas></canvas>`;
    const canvas = shadowRoot.querySelector("canvas")!;

    states.set(this, {
      drawing: false,
      color: "#000000",
      bgcolor: "#ffffff",
      size: 10,
      canvas,
      context: canvas.getContext("2d")!,
      width: this.width,
      height: this.height,
      lastX: null,
      lastY: null,
    });

    histories.set(this, {
      log: [],
      currentEntry: [],
      currentStep: 0,
    });
  }

  static get observedAttributes(): string[] {
    return ["height", "width", "color", "size", "bgcolor"];
  }

  get canvas(): HTMLCanvasElement {
    const state = states.get(this)!;
    return state.canvas;
  }

  get height(): Height {
    return this.getAttribute("height") || "";
  }

  set height(value: Height) {
    this.setAttribute("height", value);
  }

  get width(): Width {
    return this.getAttribute("width") || "";
  }

  set width(value: Width) {
    this.setAttribute("width", value);
  }

  get color(): string {
    return this.getAttribute("color") || "";
  }

  set color(value: string) {
    this.setAttribute("color", value);
  }

  get size(): string {
    return this.getAttribute("size") || "";
  }

  set size(value: string) {
    this.setAttribute("size", value);
  }

  get bgcolor(): string {
    return this.getAttribute("bgcolor") || "";
  }

  set bgcolor(value: string) {
    this.setAttribute("bgcolor", value);
  }

  get isDrawing(): boolean {
    return this.hasAttribute("drawing");
  }

  set isDrawing(value: boolean) {
    value ? this.setAttribute("drawing", "") : this.removeAttribute("drawing");
  }

  insertStep(step: Line[] | DrawStepFunction) {
    const history = histories.get(this)!;
    history.log.push(step);
    history.currentStep = history.log.length;
  }

  undo() {
    const history = histories.get(this)!;
    redraw(this, history.currentStep - 1);
  }

  redo() {
    const history = histories.get(this)!;
    redraw(this, history.currentStep + 1);
  }

  clear() {
    const { canvas, context, bgcolor, width, height } = states.get(this)!;
    canvas.style.width = width;
    canvas.width = Number(width);
    canvas.style.height = height;
    canvas.height = Number(height);

    context.beginPath();
    context.fillStyle = bgcolor;
    context.fillRect(0, 0, Number(width), Number(height));
    context.closePath();
  }

  reset() {
    this.clear();
    const history = histories.get(this)!;
    history.log = [];
    history.currentStep = 0;
  }

  attributeChangedCallback(attr: string, _oldValue: string, newValue: string) {
    const state = states.get(this)!;
    if (attr === "height") {
      state.height = newValue;
      redraw(this, undefined);
    }
    if (attr === "width") {
      state.width = newValue;
      redraw(this, undefined);
    }
    if (attr === "color") state.color = newValue;
    if (attr === "size") state.size = Number(newValue);
    if (attr === "bgcolor") {
      state.bgcolor = newValue;
      redraw(this, undefined);
    }
  }

  connectedCallback() {
    this.addEventListener("mousedown", startDrawing);
    this.addEventListener("touchstart", startDrawing);
    this.addEventListener("mouseup", stopDrawing);
    this.addEventListener("touchcancel", stopDrawing);
    this.addEventListener("mouseleave", stopDrawing);
    this.addEventListener("touchend", stopDrawing);
    this.addEventListener("touchmove", draw);
    this.addEventListener("mousemove", draw);
    this.addEventListener("keydown", historyControl);
    this.setAttribute("tabindex", "0");
  }
}

function historyControl(event: KeyboardEvent) {
  if (event.key.toLowerCase() !== "z" || (!event.metaKey && !event.ctrlKey))
    return;
  if (!(event.currentTarget instanceof DrawCanvasElement)) {
    throw new Error(
      "unexpected error: event.currentTarget must be DrawCanvasElement"
    );
  }
  event.shiftKey ? event.currentTarget.redo() : event.currentTarget.undo();
}

function redraw(element: DrawCanvasElement, toStep: number | undefined) {
  const { context } = states.get(element)!;
  const history = histories.get(element)!;
  const { log } = history;
  const destination =
    toStep === undefined
      ? history.currentStep
      : Math.max(Math.min(toStep, log.length), 0);
  let start;
  if (toStep && history.currentStep <= destination) {
    start = history.currentStep;
  } else {
    element.clear();
    start = 0;
  }
  for (const entry of log.slice(start, destination)) {
    if (entry instanceof Function) {
      entry(element);
      continue;
    }
    for (const [from, to, color, size] of entry) {
      context.lineJoin = "round";
      context.lineCap = "round";
      context.lineWidth = size;
      context.strokeStyle = color;
      context.beginPath();
      context.moveTo(...from);
      context.lineTo(...to);
      context.stroke();
      context.closePath();
    }
  }
  if (history.currentStep !== destination) {
    history.currentStep = destination;
    element.dispatchEvent(
      new CustomEvent("draw-canvas:history-step", {
        bubbles: true,
        detail: history,
      })
    );
  }
}

function startDrawing(event: MouseEvent | TouchEvent) {
  if ("touches" in event && event.touches) event.preventDefault();

  if (!(event.currentTarget instanceof DrawCanvasElement)) {
    throw new Error(
      `unexpected error: currentTarget must be DrawCanvasElement`
    );
  }

  const state = states.get(event.currentTarget)!;
  state.drawing = true;
  event.currentTarget.isDrawing = true;
}

function stopDrawing(event: MouseEvent | TouchEvent) {
  if ("touches" in event && event.touches) event.preventDefault();

  if (!(event.currentTarget instanceof DrawCanvasElement)) {
    throw new Error(
      `unexpected error: currentTarget must be DrawCanvasElement`
    );
  }

  const state = states.get(event.currentTarget)!;
  const history = histories.get(event.currentTarget)!;
  draw(event);

  if (history.currentEntry.length > 0) {
    // Rewrite history if we are not at the latest step
    if (history.currentStep !== history.log.length) {
      history.log = history.log.slice(0, history.currentStep);
    }
    event.currentTarget.insertStep(history.currentEntry);
    event.currentTarget.dispatchEvent(
      new CustomEvent("draw-canvas:history-change", {
        bubbles: true,
        detail: history,
      })
    );
  }
  history.currentEntry = [];

  state.drawing = false;
  event.currentTarget.isDrawing = false;
  state.lastX = null;
  state.lastY = null;
}

function draw(event: MouseEvent | TouchEvent) {
  if ("touches" in event && event.touches.length !== 1) return;
  if ("touches" in event && event.touches) event.preventDefault();

  if (!(event.currentTarget instanceof DrawCanvasElement)) {
    throw new Error(
      `unexpected error: currentTarget must be DrawCanvasElement`
    );
  }

  const state = states.get(event.currentTarget)!;
  const history = histories.get(event.currentTarget)!;
  const { drawing, context, color, size, lastX, lastY } = state;
  if (!drawing) return;

  const offsetX =
    event instanceof MouseEvent
      ? event.offsetX
      : event.touches[0].pageX - event.currentTarget.offsetLeft;
  const offsetY =
    event instanceof MouseEvent
      ? event.offsetY
      : event.touches[0].pageY - event.currentTarget.offsetTop;
  const from: Point = [lastX || offsetX, lastY || offsetY];
  const to: Point = [offsetX, offsetY];
  history.currentEntry.push([from, to, color, size]);
  context.lineJoin = "round";
  context.lineCap = "round";
  context.lineWidth = size;
  context.strokeStyle = color;
  context.beginPath();
  context.moveTo(...from);
  context.lineTo(...to);
  context.stroke();
  context.closePath();

  state.lastX = offsetX;
  state.lastY = offsetY;
}
