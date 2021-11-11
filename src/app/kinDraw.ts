import { changeDpiBlob } from "changedpi";
import { DrawCanvasElement } from "./DrawCanvasElement";

if (window.customElements.get("draw-canvas") === undefined) {
  window.customElements.define("draw-canvas", DrawCanvasElement);
}

function generateDrawCanvas(): DrawCanvasElement {
  return document.createElement("draw-canvas") as DrawCanvasElement;
}

function getFormElement(commentForm: Element): HTMLElement {
  const formElement = commentForm.querySelector(
    "form.ocean-ui-comments-commentform-form"
  )!;
  if (!(formElement instanceof HTMLElement)) {
    throw new Error("unexpected error: formElement must be HTMLElement");
  }
  return formElement;
}

function getEditorFieldElement(commentForm: Element): HTMLElement {
  const editorFieldElement = commentForm.querySelector(
    ".ocean-ui-editor-field"
  );
  if (!(editorFieldElement instanceof HTMLElement)) {
    throw new Error("unexpected error: editorFieldElement must be HTMLElement");
  }
  return editorFieldElement;
}

// App comments are not supported because images cannot be uploaded.
if (document.querySelector("#layout-ocean") !== null) {
  setInterval(() => {
    const commentForms = document.querySelectorAll(
      '.ocean-ui-comments-commentform[aria-expanded="true"]'
    );
    Array.from(commentForms)
      .filter((commentForm) => {
        return commentForm.getElementsByClassName("kinDraw-draw").length === 0;
      })
      .forEach((commentForm) => {
        const drawButtonElement = document.createElement("div");
        drawButtonElement.classList.add("goog-inline-block");
        drawButtonElement.classList.add("goog-toolbar-button");
        drawButtonElement.classList.add("kinDraw-draw");
        drawButtonElement.style.userSelect = "none";
        const outerBoxElement = document.createElement("div");
        outerBoxElement.classList.add("goog-inline-block");
        outerBoxElement.classList.add("goog-toolbar-button-outer-box");
        outerBoxElement.style.userSelect = "none";
        const innerBoxElement = document.createElement("div");
        innerBoxElement.classList.add("goog-inline-block");
        innerBoxElement.classList.add("goog-toolbar-button-inner-box");
        innerBoxElement.textContent = "Draw";
        innerBoxElement.style.userSelect = "none";

        outerBoxElement.appendChild(innerBoxElement);
        drawButtonElement.appendChild(outerBoxElement);

        const toolbarElement = commentForm.querySelector(
          ".ocean-ui-editor-toolbar .goog-toolbar-horizontal"
        );
        if (toolbarElement === null) {
          throw new Error(`can't find toolbar element: ${commentForm}`);
        }
        toolbarElement.appendChild(drawButtonElement);

        const drawCanvasContainerElement = document.createElement("div");
        const optionsElement = document.createElement("div");
        optionsElement.classList.add("kinDraw-options");
        const resetButtonElement = document.createElement("button");
        resetButtonElement.textContent = "Reset";
        optionsElement.appendChild(resetButtonElement);
        const loadImageLabelElement = document.createElement("label");
        loadImageLabelElement.classList.add("kinDraw-load-image");
        loadImageLabelElement.textContent = "Load Image";
        const loadImageInputElement = document.createElement("input");
        loadImageInputElement.type = "file";
        loadImageInputElement.hidden = true;
        loadImageLabelElement.appendChild(loadImageInputElement);
        optionsElement.appendChild(loadImageLabelElement);
        const colorLabelElement = document.createElement("label");
        colorLabelElement.textContent = "color";
        const colorInputElement = document.createElement("input");
        colorInputElement.type = "color";
        colorLabelElement.appendChild(colorInputElement);
        optionsElement.appendChild(colorLabelElement);
        const bgcolorLabelElement = document.createElement("label");
        bgcolorLabelElement.textContent = "bgcolor";
        const bgcolorInputElement = document.createElement("input");
        bgcolorInputElement.type = "color";
        bgcolorLabelElement.appendChild(bgcolorInputElement);
        optionsElement.appendChild(bgcolorLabelElement);
        const sizeLabelElement = document.createElement("label");
        sizeLabelElement.textContent = "size";
        const sizeInputElement = document.createElement("input");
        sizeInputElement.type = "number";
        sizeLabelElement.appendChild(sizeInputElement);
        optionsElement.appendChild(sizeLabelElement);
        const widthLabelElement = document.createElement("label");
        widthLabelElement.textContent = "width";
        const widthInputElement = document.createElement("input");
        widthInputElement.type = "number";
        widthLabelElement.appendChild(widthInputElement);
        optionsElement.appendChild(widthLabelElement);
        const heightLabelElement = document.createElement("label");
        heightLabelElement.textContent = "height";
        const heightInputElement = document.createElement("input");
        heightInputElement.type = "number";
        heightLabelElement.appendChild(heightInputElement);
        optionsElement.appendChild(heightLabelElement);
        const drawCanvas = generateDrawCanvas();
        const drawCanvasOuterBoxElement = document.createElement("div");
        drawCanvasOuterBoxElement.classList.add("draw-canvas-outer");
        drawCanvasOuterBoxElement.appendChild(drawCanvas);
        const cancelButton = document.createElement("button");
        cancelButton.classList.add("kinDraw-cancel");
        cancelButton.textContent = "Cancel";
        const uploadButton = document.createElement("button");
        uploadButton.classList.add("kinDraw-upload");
        uploadButton.textContent = "Upload";

        drawCanvasContainerElement.appendChild(optionsElement);
        drawCanvasContainerElement.appendChild(drawCanvasOuterBoxElement);
        drawCanvasContainerElement.appendChild(cancelButton);
        drawCanvasContainerElement.appendChild(uploadButton);

        drawButtonElement.addEventListener("click", () => {
          const formElement = getFormElement(commentForm);
          const formWidth = formElement.clientWidth;
          const defaultColor = "#666666";
          const defaultBGColor = "#f0f0f0";
          const defaultSize = "3";
          const defaultCanvasWidth = formWidth < 500 ? formWidth : 500;
          const defaultCanvasHeight = 500;

          colorInputElement.value = defaultColor;
          drawCanvas.color = defaultColor;
          bgcolorInputElement.value = defaultBGColor;
          drawCanvas.bgcolor = defaultBGColor;
          sizeInputElement.value = defaultSize;
          drawCanvas.size = defaultSize;
          widthInputElement.value = defaultCanvasWidth.toString();
          drawCanvas.width = defaultCanvasWidth.toString();
          heightInputElement.value = defaultCanvasHeight.toString();
          drawCanvas.height = defaultCanvasHeight.toString();
          formElement.parentNode!.insertBefore(
            drawCanvasContainerElement,
            formElement
          );
          formElement.hidden = true;
        });

        resetButtonElement.addEventListener("click", () => {
          drawCanvas.reset();
        });

        loadImageInputElement.addEventListener("change", async () => {
          if (
            loadImageInputElement.files === null ||
            loadImageInputElement.files.length === 0
          ) {
            return;
          }
          const bitmap = await createImageBitmap(
            loadImageInputElement.files[0]
          );
          const height =
            bitmap.height * (Number(drawCanvas.width) / bitmap.width);
          drawCanvas.height = height.toString();
          heightInputElement.value = height.toString();

          const drawImage = (el: DrawCanvasElement) => {
            const context = el.canvas.getContext("2d")!;
            context.drawImage(
              bitmap,
              0,
              0,
              Number(el.width),
              Number(el.height)
            );
          };
          drawImage(drawCanvas);
          drawCanvas.insertStep(drawImage);
        });

        colorInputElement.addEventListener("change", () => {
          drawCanvas.color = colorInputElement.value;
        });

        bgcolorInputElement.addEventListener("change", () => {
          drawCanvas.bgcolor = bgcolorInputElement.value;
        });

        sizeInputElement.addEventListener("change", () => {
          drawCanvas.size = sizeInputElement.value;
        });

        widthInputElement.addEventListener("change", () => {
          drawCanvas.width = widthInputElement.value;
        });

        heightInputElement.addEventListener("change", () => {
          drawCanvas.height = heightInputElement.value;
        });

        cancelButton.addEventListener("click", () => {
          const formElement = getFormElement(commentForm);
          formElement.hidden = false;
          drawCanvasContainerElement.parentNode!.removeChild(
            drawCanvasContainerElement
          );
        });

        uploadButton.addEventListener("click", () => {
          drawCanvas.canvas.toBlob(async function (blob) {
            const newBlob = await changeDpiBlob(blob!, 72);
            const file = new File([newBlob], "draw.png", { type: "image/png" });
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);

            const formElement = getFormElement(commentForm);
            formElement.hidden = false;
            const editorFieldElement = getEditorFieldElement(commentForm);
            if (editorFieldElement.tagName.toLowerCase() === "iframe") {
              const iframe = editorFieldElement as HTMLIFrameElement;
              iframe.contentDocument!.dispatchEvent(
                new DragEvent("drop", {
                  dataTransfer,
                })
              );
            } else {
              editorFieldElement.dispatchEvent(
                new DragEvent("drop", {
                  dataTransfer,
                })
              );
            }
            drawCanvasContainerElement.parentNode!.removeChild(
              drawCanvasContainerElement
            );
          });
        });
      });
  }, 1000);
}
