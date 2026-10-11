const contextTitle = document.querySelector("#context-title");
const contextText = document.querySelector("#context-text");
const clueList = document.querySelector("#clue-list");
const slots = Array.from(document.querySelectorAll(".slot"));
const combineButton = document.querySelector("#combine-button");
const combineOkButton = document.querySelector("#combine-ok-button");
const cursorHint = document.querySelector("#cursor-hint");
const lock = document.querySelector("#lock");
const drawer = document.querySelector("#drawer");
const drawerLabel = document.querySelector("#drawer-label");
const successMessage = document.querySelector("#success-message");
const inventory = [];
let selectedSlot = null;
let isCombineMode = false;
let combineSelection = [];
let isSolved = false;

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
  slots.forEach((slot, index) => {
    const item = inventory[index];
    slot.textContent = item || "Vazio";
    slot.classList.toggle("filled", Boolean(item));
    slot.classList.toggle("combine-selected", combineSelection.includes(item));
  });
}

function clearSelection() {
  selectedSlot = null;
  slots.forEach((slot) => slot.classList.remove("selected"));
}

function updateCombineControls() {
  document.body.classList.toggle("combine-mode", isCombineMode);
  combineButton.classList.toggle("active", isCombineMode);
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
      ? `Selecionado: ${combineSelection.join(" + ")}.`
      : "Clique em dois itens do inventário para tentar uma combinação."
  );
}

function combineSelectedItems() {
  const selected = [...combineSelection].sort().join("+");

  if (selected === "Caneta+Clipe" && !inventory.includes("Ferramenta improvisada")) {
    inventory.push("Ferramenta improvisada");
    addClue("Clipe e caneta podem virar uma ferramenta para manipular o cadeado.");
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
  button.addEventListener("click", () => {
    const item = button.dataset.item;

    updateContext(item, button.dataset.description);

    if (!inventory.includes(item) && inventory.length < slots.length) {
      inventory.push(item);
      button.classList.add("collected");
      addClue(`${item} adicionado ao inventário.`);
      renderInventory();
    }
  });
});

lock.addEventListener("click", (event) => {
  if (isSolved) {
    updateContext("Cadeado aberto", "O cadeado já está aberto. A gaveta pode ser investigada.");
    return;
  }

  if (selectedSlot === "Ferramenta improvisada") {
    solvePuzzle();
    return;
  }

  updateContext("Cadeado", event.currentTarget.dataset.description);
  addClue("Selecione uma ferramenta no inventário antes de tentar o cadeado.");
});

slots.forEach((slot) => {
  slot.addEventListener("click", () => {
    if (!slot.classList.contains("filled")) {
      return;
    }

    if (isCombineMode) {
      toggleCombineItem(slot.textContent);
      return;
    }

    slots.forEach((item) => item.classList.remove("selected"));
    slot.classList.add("selected");
    selectedSlot = slot.textContent;
    updateContext(selectedSlot, `Item selecionado: ${selectedSlot}. Clique em algo no cenário para tentar usar.`);
  });
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
