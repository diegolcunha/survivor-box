const contextTitle = document.querySelector("#context-title");
const contextText = document.querySelector("#context-text");
const clueList = document.querySelector("#clue-list");
const slots = Array.from(document.querySelectorAll(".slot"));
const combineButton = document.querySelector("#combine-button");
const lock = document.querySelector("#lock");
const drawer = document.querySelector("#drawer");
const drawerLabel = document.querySelector("#drawer-label");
const successMessage = document.querySelector("#success-message");
const inventory = [];
let selectedSlot = null;
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
  });
}

function clearSelection() {
  selectedSlot = null;
  slots.forEach((slot) => slot.classList.remove("selected"));
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

    slots.forEach((item) => item.classList.remove("selected"));
    slot.classList.add("selected");
    selectedSlot = slot.textContent;
    updateContext(selectedSlot, `Item selecionado: ${selectedSlot}. Clique em algo no cenário para tentar usar.`);
  });
});

combineButton.addEventListener("click", () => {
  const hasPaperclip = inventory.includes("Clipe");
  const hasPen = inventory.includes("Caneta");

  if (hasPaperclip && hasPen && !inventory.includes("Ferramenta improvisada")) {
    inventory.push("Ferramenta improvisada");
    addClue("Clipe e caneta podem virar uma ferramenta para manipular o cadeado.");
    updateContext(
      "Ferramenta improvisada",
      "O clipe desdobrado ganha apoio no corpo da caneta. Não é elegante, mas parece funcional."
    );
    renderInventory();
    return;
  }

  updateContext(
    "Combinação",
    "Nada se encaixa de um jeito útil ainda. Observe o formato e a função dos itens."
  );
});
