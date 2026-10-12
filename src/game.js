const contextTitle = document.querySelector("#context-title");
const contextText = document.querySelector("#context-text");
const clueList = document.querySelector("#clue-list");
const inventoryItems = document.querySelector("#inventory-items");
const combineButton = document.querySelector("#combine-button");
const combineInstruction = document.querySelector("#combine-instruction");
const combineOkButton = document.querySelector("#combine-ok-button");
const cursorHint = document.querySelector("#cursor-hint");
const inventoryPanel = document.querySelector(".inventory");
const scene = document.querySelector(".scene");
const desk = document.querySelector(".desk");
const lock = document.querySelector("#lock");
const drawer = document.querySelector("#drawer");
const drawerLabel = document.querySelector("#drawer-label");
const successMessage = document.querySelector("#success-message");
const inventory = [];
const sceneItems = new Map();
const itemIcons = {
  Clipe: "⌁",
  Caneta: "▰",
  Fita: "◎",
  Régua: "▭",
  "Ferramenta improvisada": "⚒",
};
let selectedSlot = null;
let isCombineMode = false;
let combineSelection = [];
let isSolved = false;
let dragState = null;
let suppressNextClick = false;

function updateContext(title, text) {
  contextTitle.textContent = title;
  contextText.textContent = text;
}

function addClue(text) {
  const exists = Array.from(clueList.children).some((item) => item.textContent === text);

  if (!exists) {
    const clue = document.createElement("li");
    clue.textContent = text;
    clueList.appendChild(clue);
  }
}

function renderInventory() {
  inventoryItems.innerHTML = "";

  if (!inventory.length) {
    const emptyState = document.createElement("span");
    emptyState.className = "inventory-empty";
    emptyState.textContent = "Arraste itens para cá.";
    inventoryItems.appendChild(emptyState);
    return;
  }

  inventory.forEach((item) => {
    const token = document.createElement("button");
    token.className = "inventory-token";
    token.type = "button";
    token.dataset.item = item;
    token.innerHTML = `<span class="token-icon">${itemIcons[item] || "•"}</span><span>${item}</span>`;
    token.classList.toggle("selected", selectedSlot === item);
    token.classList.toggle("combine-selected", combineSelection.includes(item));
    token.addEventListener("pointerdown", (event) => startPotentialDrag(event, item, "inventory", token));
    token.addEventListener("click", () => handleInventoryItemClick(item, token));
    inventoryItems.appendChild(token);
  });
}

function clearSelection() {
  selectedSlot = null;
  inventoryItems.querySelectorAll(".inventory-token").forEach((item) => item.classList.remove("selected"));
}

function updateCombineControls() {
  document.body.classList.toggle("combine-mode", isCombineMode);
  combineButton.classList.toggle("active", isCombineMode);
  combineButton.textContent = isCombineMode ? "Cancelar" : "Combinar itens";
  combineInstruction.hidden = !isCombineMode;
  combineInstruction.classList.toggle("ready", combineSelection.length === 2);
  combineInstruction.textContent =
    combineSelection.length === 2
      ? `Selecionados: ${combineSelection.join(" + ")}`
      : "Clique nos itens para combinar";
  combineOkButton.hidden = !isCombineMode;
  combineOkButton.disabled = combineSelection.length !== 2;
  cursorHint.classList.toggle("visible", isCombineMode);
  renderInventory();
}

function exitCombineMode() {
  isCombineMode = false;
  combineSelection = [];
  updateCombineControls();
}

function toggleCombineItem(item) {
  if (combineSelection.includes(item)) {
    combineSelection = combineSelection.filter((selectedItem) => selectedItem !== item);
  } else if (combineSelection.length < 2) {
    combineSelection.push(item);
  }

  updateCombineControls();
  updateContext(
    "Combinar itens",
    combineSelection.length
      ? `Selecionado: ${combineSelection.join(" + ")}. Clique em OK para confirmar quando tiver dois itens.`
      : "Clique em dois itens do inventário para tentar uma combinação."
  );
}

function combineSelectedItems() {
  const selected = [...combineSelection].sort().join("+");

  if (selected === "Caneta+Clipe" && !inventory.includes("Ferramenta improvisada")) {
    consumeItems(["Caneta", "Clipe"]);
    clearSelection();
    inventory.push("Ferramenta improvisada");
    addClue("Clipe e caneta foram consumidos para criar uma ferramenta improvisada.");
    updateContext(
      "Ferramenta improvisada",
      "O clipe desdobrado ganha apoio no corpo da caneta. Não é elegante, mas parece funcional."
    );
    exitCombineMode();
    renderInventory();
    return;
  }

  updateContext(
    "Combinação",
    "Nada se encaixa de um jeito útil ainda. Observe o formato e a função dos itens."
  );
  exitCombineMode();
}

function consumeItems(items) {
  items.forEach((item) => {
    const itemIndex = inventory.indexOf(item);

    if (itemIndex !== -1) {
      inventory.splice(itemIndex, 1);
      sceneItems.get(item)?.classList.add("collected");
    }
  });
}

function isPointInsideElement(x, y, element) {
  const rect = element.getBoundingClientRect();

  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

function createDragGhost(label) {
  const ghost = document.createElement("div");
  ghost.className = "drag-ghost";
  ghost.textContent = label;
  document.body.appendChild(ghost);

  return ghost;
}

function moveDragGhost(x, y) {
  if (!dragState?.ghost) {
    return;
  }

  dragState.ghost.style.left = `${x}px`;
  dragState.ghost.style.top = `${y}px`;
}

function collectItem(item) {
  if (inventory.includes(item)) {
    return;
  }

  inventory.push(item);
  const sceneItem = sceneItems.get(item);

  if (sceneItem?.classList.contains("dropped-item")) {
    sceneItem.remove();
    sceneItems.delete(item);
  } else {
    sceneItem?.classList.add("collected");
  }

  addClue(`${item} adicionado ao inventário.`);
  renderInventory();
}

function removeInventoryItem(item) {
  const itemIndex = inventory.indexOf(item);

  if (itemIndex === -1) {
    return;
  }

  inventory.splice(itemIndex, 1);
  combineSelection = combineSelection.filter((selectedItem) => selectedItem !== item);

  if (selectedSlot === item) {
    clearSelection();
  }

  sceneItems.get(item)?.classList.remove("collected");
  addClue(`${item} removido do inventário.`);
  renderInventory();
  updateCombineControls();
}

function removeItemFromInventory(item) {
  const itemIndex = inventory.indexOf(item);

  if (itemIndex === -1) {
    return false;
  }

  inventory.splice(itemIndex, 1);
  combineSelection = combineSelection.filter((selectedItem) => selectedItem !== item);

  if (selectedSlot === item) {
    clearSelection();
  }

  renderInventory();
  updateCombineControls();
  return true;
}

function dropInventoryItemOnDesk(item, x, y) {
  if (!removeItemFromInventory(item)) {
    return;
  }

  const deskRect = desk.getBoundingClientRect();
  const left = Math.min(Math.max(x - deskRect.left, 34), deskRect.width - 98);
  const top = Math.min(Math.max(y - deskRect.top, 26), deskRect.height - 54);
  const droppedItem = document.createElement("button");
  droppedItem.className = "hotspot dropped-item";
  droppedItem.type = "button";
  droppedItem.dataset.item = item;
  droppedItem.dataset.description = `${item} está sobre a mesa. Pode ser usado, examinado ou levado de volta ao inventário.`;
  droppedItem.style.left = `${left}px`;
  droppedItem.style.top = `${top}px`;
  droppedItem.innerHTML = `<span>${itemIcons[item] || "•"}</span>${item}`;

  droppedItem.addEventListener("pointerdown", (event) => {
    startPotentialDrag(event, item, "scene", droppedItem);
  });
  droppedItem.addEventListener("click", () => {
    if (suppressNextClick) {
      return;
    }

    updateContext(item, droppedItem.dataset.description);
  });

  sceneItems.set(item, droppedItem);
  desk.appendChild(droppedItem);
  addClue(`${item} colocado sobre a mesa.`);
  updateContext(item, `${item} agora está sobre a mesa.`);
}

function resetDrag() {
  dragState?.ghost?.remove();
  dragState?.sourceElement?.classList.remove("drag-source");
  inventoryPanel.classList.remove("drop-target");
  desk.classList.remove("drop-target");
  lock.classList.remove("use-target");
  document.body.classList.remove("dragging-item");
  dragState = null;
}

function startPotentialDrag(event, item, source, sourceElement) {
  if (event.button !== undefined && event.button !== 0) {
    return;
  }

  dragState = {
    item,
    source,
    sourceElement,
    startX: event.clientX,
    startY: event.clientY,
    currentX: event.clientX,
    currentY: event.clientY,
    isDragging: false,
    ghost: null,
  };

  sourceElement.setPointerCapture?.(event.pointerId);
}

function handleInventoryItemClick(item, token) {
  if (suppressNextClick) {
    return;
  }

  if (isCombineMode) {
    toggleCombineItem(item);
    return;
  }

  inventoryItems.querySelectorAll(".inventory-token").forEach((tokenItem) => tokenItem.classList.remove("selected"));
  token.classList.add("selected");
  selectedSlot = item;
  updateContext(selectedSlot, `Item selecionado: ${selectedSlot}. Arraste para o cenário para tentar usar.`);
}

function updateDrag(event) {
  if (!dragState) {
    return;
  }

  dragState.currentX = event.clientX;
  dragState.currentY = event.clientY;

  const distance = Math.hypot(event.clientX - dragState.startX, event.clientY - dragState.startY);

  if (!dragState.isDragging && distance > 6) {
    dragState.isDragging = true;
    dragState.ghost = createDragGhost(dragState.item);
    dragState.sourceElement.classList.add("drag-source");
    document.body.classList.add("dragging-item");
  }

  if (!dragState.isDragging) {
    return;
  }

  moveDragGhost(event.clientX, event.clientY);
  inventoryPanel.classList.toggle(
    "drop-target",
    dragState.source === "scene" && isPointInsideElement(event.clientX, event.clientY, inventoryPanel)
  );
  lock.classList.toggle(
    "use-target",
    dragState.source === "inventory" &&
      dragState.item === "Ferramenta improvisada" &&
      !isSolved &&
      isPointInsideElement(event.clientX, event.clientY, lock)
  );
  desk.classList.toggle(
    "drop-target",
    dragState.source === "inventory" &&
      !isPointInsideElement(event.clientX, event.clientY, inventoryPanel) &&
      isPointInsideElement(event.clientX, event.clientY, desk)
  );
}

function finishDrag() {
  if (!dragState) {
    return false;
  }

  const wasDragging = dragState.isDragging;

  if (wasDragging) {
    suppressNextClick = true;
    window.setTimeout(() => {
      suppressNextClick = false;
    }, 120);
  }

  if (wasDragging && dragState.source === "scene") {
    if (isPointInsideElement(dragState.currentX, dragState.currentY, inventoryPanel)) {
      collectItem(dragState.item);
      updateContext(dragState.item, `${dragState.item} foi guardado no inventário.`);
    } else {
      updateContext(dragState.item, "Arraste o item até o inventário para guardá-lo.");
    }
  }

  if (wasDragging && dragState.source === "inventory") {
    if (
      dragState.item === "Ferramenta improvisada" &&
      !isSolved &&
      isPointInsideElement(dragState.currentX, dragState.currentY, lock)
    ) {
      solvePuzzle();
      resetDrag();
      return true;
    }

    if (!isPointInsideElement(dragState.currentX, dragState.currentY, inventoryPanel)) {
      if (isPointInsideElement(dragState.currentX, dragState.currentY, desk)) {
        dropInventoryItemOnDesk(dragState.item, dragState.currentX, dragState.currentY);
      } else {
        removeInventoryItem(dragState.item);
        updateContext(dragState.item, `${dragState.item} saiu do inventário.`);
      }
    }
  }

  resetDrag();

  return wasDragging;
}

function solvePuzzle() {
  isSolved = true;
  lock.classList.add("open");
  drawer.classList.add("open");
  successMessage.classList.add("visible");
  drawerLabel.textContent = "Gaveta aberta";
  clearSelection();
  addClue("A ferramenta improvisada abriu o cadeado.");
  updateContext(
    "Gaveta aberta",
    "O cadeado cede com um clique seco. A gaveta desliza alguns centímetros, revelando que a solução funcionou."
  );
}

document.querySelectorAll(".item").forEach((button) => {
  sceneItems.set(button.dataset.item, button);

  button.addEventListener("pointerdown", (event) => {
    if (button.classList.contains("collected")) {
      return;
    }

    startPotentialDrag(event, button.dataset.item, "scene", button);
  });

  button.addEventListener("click", () => {
    if (suppressNextClick) {
      return;
    }

    const item = button.dataset.item;

    updateContext(item, button.dataset.description);
  });
});

lock.addEventListener("click", (event) => {
  if (isSolved) {
    updateContext("Cadeado aberto", "O cadeado já está aberto. A gaveta pode ser investigada.");
    return;
  }

  updateContext("Cadeado", event.currentTarget.dataset.description);
  addClue("Arraste uma ferramenta do inventário até o cadeado para tentar usá-la.");
});

combineButton.addEventListener("click", () => {
  if (isCombineMode) {
    exitCombineMode();
    updateContext("Combinar itens", "Modo de combinação cancelado.");
    return;
  }

  clearSelection();
  isCombineMode = true;
  combineSelection = [];
  updateCombineControls();
  updateContext("Combinar itens", "Clique em dois itens do inventário para tentar uma combinação.");
});

combineOkButton.addEventListener("click", () => {
  if (combineSelection.length !== 2) {
    updateContext("Combinar itens", "Escolha dois itens antes de confirmar.");
    return;
  }

  combineSelectedItems();
});

document.addEventListener("mousemove", (event) => {
  if (!isCombineMode) {
    return;
  }

  cursorHint.style.left = `${event.clientX}px`;
  cursorHint.style.top = `${event.clientY}px`;
});

document.addEventListener("pointermove", updateDrag);

document.addEventListener("pointerup", () => {
  finishDrag();
});

document.addEventListener("pointercancel", resetDrag);
