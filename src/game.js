const contextTitle = document.querySelector("#context-title");
const contextText = document.querySelector("#context-text");
const clueList = document.querySelector("#clue-list");
const inventoryItems = document.querySelector("#inventory-items");
const combineButton = document.querySelector("#combine-button");
const combineInstruction = document.querySelector("#combine-instruction");
const combineOkButton = document.querySelector("#combine-ok-button");
const cursorHint = document.querySelector("#cursor-hint");
const actionHint = document.querySelector("#action-hint");
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
  Clipe: "src/assets/icons/clipe.png",
  Caneta: "src/assets/icons/caneta.png",
  Fita: "src/assets/icons/fita.png",
  Régua: "src/assets/icons/regua.png",
  "Ferramenta improvisada": "src/assets/icons/ferramenta-improvisada.png",
  Engenhoca: "src/assets/icons/engenhoca.png",
};
let selectedSlot = null;
let isCombineMode = false;
let combineSelection = [];
let combineTargets = [];
let isSolved = false;
let dragState = null;
let suppressNextClick = false;
let improvisedItemCount = 0;
let actionHintTimer = null;

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

function getItemIcon(item) {
  if (item.startsWith("Engenhoca")) {
    return itemIcons.Engenhoca;
  }

  return itemIcons[item] || itemIcons.Engenhoca;
}

function itemMarkup(item, iconClass) {
  return `<img class="${iconClass}" src="${getItemIcon(item)}" alt="" draggable="false" /><span>${item}</span>`;
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
    token.innerHTML = itemMarkup(item, "token-icon");
    token.classList.toggle("selected", selectedSlot === item);
    token.classList.toggle(
      "combine-selected",
      combineTargets.some((target) => target.source === "inventory" && target.item === item)
    );
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
  refreshSceneCombineSelection();
  renderInventory();
}

function exitCombineMode() {
  isCombineMode = false;
  combineSelection = [];
  combineTargets = [];
  updateCombineControls();
}

function refreshSceneCombineSelection() {
  document.querySelectorAll(".hotspot.combine-selected").forEach((item) => item.classList.remove("combine-selected"));
  combineTargets.forEach((target) => {
    if (target.source === "scene") {
      target.element.classList.add("combine-selected");
    }
  });
}

function toggleCombineItem(item, source, element) {
  const existingIndex = combineTargets.findIndex((target) =>
    source === "inventory"
      ? target.source === "inventory" && target.item === item
      : target.element === element
  );

  if (existingIndex !== -1) {
    combineTargets.splice(existingIndex, 1);
  } else if (combineTargets.length < 2) {
    combineTargets.push({ item, source, element });
  }

  combineSelection = combineTargets.map((target) => target.item);
  refreshSceneCombineSelection();
  updateCombineControls();
  updateContext(
    "Combinar itens",
    combineSelection.length
      ? `Selecionado: ${combineSelection.join(" + ")}. Clique em OK para confirmar quando tiver dois itens.`
      : "Clique em dois itens do inventário ou da mesa para tentar uma combinação."
  );
}

function combineSelectedItems() {
  const selected = [...combineSelection].sort().join("+");
  const sourceItemsLabel = combineSelection.join(" + ");
  const hasTool = inventory.includes("Ferramenta improvisada") || sceneItems.has("Ferramenta improvisada");
  const resultItem =
    selected === "Caneta+Clipe" && !hasTool
      ? "Ferramenta improvisada"
      : createImprovisedItemName();
  const resultPosition = getCombinationResultPosition();

  consumeSelectedTargets();
  clearSelection();

  if (resultPosition) {
    createDeskItem(resultItem, resultPosition.x, resultPosition.y);
  } else {
    inventory.push(resultItem);
  }

  if (resultItem === "Ferramenta improvisada") {
    addClue("Clipe e caneta foram consumidos para criar uma ferramenta improvisada.");
    updateContext(
      "Ferramenta improvisada",
      "O clipe desdobrado ganha apoio no corpo da caneta. Não é elegante, mas parece funcional."
    );
  } else {
    addClue(`${sourceItemsLabel} viraram ${resultItem}.`);
    updateContext(
      resultItem,
      "Os itens foram combinados em uma engenhoca improvisada. Ainda não está claro se ela resolve algo."
    );
  }

  exitCombineMode();
  renderInventory();
}

function createImprovisedItemName() {
  improvisedItemCount += 1;
  return `Engenhoca ${improvisedItemCount}`;
}

function getCombinationResultPosition() {
  const sceneTargets = combineTargets.filter((target) => target.source === "scene");

  if (!sceneTargets.length) {
    return null;
  }

  const centers = sceneTargets.map((target) => {
    const rect = target.element.getBoundingClientRect();

    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
  });

  return {
    x: centers.reduce((sum, center) => sum + center.x, 0) / centers.length,
    y: centers.reduce((sum, center) => sum + center.y, 0) / centers.length,
  };
}

function consumeSelectedTargets() {
  combineTargets.forEach((target) => {
    if (target.source === "inventory") {
      const itemIndex = inventory.indexOf(target.item);

      if (itemIndex !== -1) {
        inventory.splice(itemIndex, 1);
      }
    }

    if (target.source === "scene") {
      target.element.remove();
      sceneItems.delete(target.item);
    }
  });
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

function isToolOverLock() {
  return (
    dragState?.item === "Ferramenta improvisada" &&
    !isSolved &&
    isPointInsideElement(dragState.currentX, dragState.currentY, lock)
  );
}

function isAnyItemOverLock() {
  return !isSolved && isPointInsideElement(dragState.currentX, dragState.currentY, lock);
}

function showActionHint(text, x, y) {
  actionHint.textContent = text;
  actionHint.style.left = `${x}px`;
  actionHint.style.top = `${y}px`;
  actionHint.classList.add("visible");

  window.clearTimeout(actionHintTimer);
  actionHintTimer = window.setTimeout(() => {
    actionHint.classList.remove("visible");
  }, 1400);
}

function createDragGhost(item) {
  const ghost = document.createElement("div");
  ghost.className = "drag-ghost";
  ghost.innerHTML = itemMarkup(item, "item-icon");
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

function moveDraggedSceneItem(x, y) {
  if (dragState?.source !== "scene") {
    return;
  }

  placeSceneItemOnDesk(dragState.sourceElement, x, y);
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

  createDeskItem(item, x, y);
  addClue(`${item} colocado sobre a mesa.`);
  updateContext(item, `${item} agora está sobre a mesa.`);
}

function createDeskItem(item, x, y) {
  const deskRect = desk.getBoundingClientRect();
  const left = Math.min(Math.max(x - deskRect.left, 34), deskRect.width - 112);
  const top = Math.min(Math.max(y - deskRect.top, 26), deskRect.height - 100);
  const droppedItem = document.createElement("button");
  droppedItem.className = "hotspot dropped-item";
  droppedItem.type = "button";
  droppedItem.dataset.item = item;
  droppedItem.dataset.description = `${item} está sobre a mesa. Pode ser usado, examinado ou levado de volta ao inventário.`;
  droppedItem.style.left = `${left}px`;
  droppedItem.style.top = `${top}px`;
  droppedItem.innerHTML = itemMarkup(item, "item-icon");

  droppedItem.addEventListener("pointerdown", (event) => {
    startPotentialDrag(event, item, "scene", droppedItem);
  });
  droppedItem.addEventListener("click", () => {
    if (suppressNextClick) {
      return;
    }

    if (isCombineMode) {
      toggleCombineItem(item, "scene", droppedItem);
      return;
    }

    updateContext(item, droppedItem.dataset.description);
  });

  sceneItems.set(item, droppedItem);
  desk.appendChild(droppedItem);
}

function placeSceneItemOnDesk(sceneItem, x, y) {
  const deskRect = desk.getBoundingClientRect();
  const itemRect = sceneItem.getBoundingClientRect();
  const halfWidth = Math.max(itemRect.width / 2, 48);
  const halfHeight = Math.max(itemRect.height / 2, 22);
  const left = Math.min(Math.max(x - deskRect.left - halfWidth, 14), deskRect.width - itemRect.width - 14);
  const top = Math.min(Math.max(y - deskRect.top - halfHeight, 16), deskRect.height - itemRect.height - 16);

  sceneItem.style.left = `${left}px`;
  sceneItem.style.top = `${top}px`;
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
    toggleCombineItem(item, "inventory", token);
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
    if (dragState.source !== "scene") {
      dragState.ghost = createDragGhost(dragState.item);
    }
    dragState.sourceElement.classList.add("drag-source");
    document.body.classList.add("dragging-item");
  }

  if (!dragState.isDragging) {
    return;
  }

  moveDragGhost(event.clientX, event.clientY);
  moveDraggedSceneItem(event.clientX, event.clientY);
  inventoryPanel.classList.toggle(
    "drop-target",
    dragState.source === "scene" && isPointInsideElement(event.clientX, event.clientY, inventoryPanel)
  );
  lock.classList.toggle(
    "use-target",
    (dragState.source === "inventory" || dragState.sourceElement.classList.contains("dropped-item")) && isToolOverLock()
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
    if (isToolOverLock()) {
      solvePuzzle();
      resetDrag();
      return true;
    }

    if (isAnyItemOverLock()) {
      showActionHint("A ferramenta parece não ter efeito.", dragState.currentX, dragState.currentY);
      updateContext(dragState.item, "A tentativa não altera o cadeado. Talvez este item não seja a ferramenta certa.");
      resetDrag();
      return true;
    }

    if (isPointInsideElement(dragState.currentX, dragState.currentY, inventoryPanel)) {
      collectItem(dragState.item);
      updateContext(dragState.item, `${dragState.item} foi guardado no inventário.`);
    } else if (isPointInsideElement(dragState.currentX, dragState.currentY, desk)) {
      placeSceneItemOnDesk(dragState.sourceElement, dragState.currentX, dragState.currentY);
      updateContext(dragState.item, `${dragState.item} reposicionado sobre a mesa.`);
    } else {
      updateContext(dragState.item, "Arraste o item até o inventário para guardá-lo.");
    }
  }

  if (wasDragging && dragState.source === "inventory") {
    if (isToolOverLock()) {
      solvePuzzle();
      resetDrag();
      return true;
    }

    if (isAnyItemOverLock()) {
      showActionHint("A ferramenta parece não ter efeito.", dragState.currentX, dragState.currentY);
      updateContext(dragState.item, "A tentativa não altera o cadeado. Talvez este item não seja a ferramenta certa.");
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
  button.innerHTML = itemMarkup(button.dataset.item, "item-icon");

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

    if (isCombineMode) {
      toggleCombineItem(item, "scene", button);
      return;
    }

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
  updateContext("Combinar itens", "Clique em dois itens do inventário ou da mesa para tentar uma combinação.");
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
