const contextTitle = document.querySelector("#context-title");
const contextText = document.querySelector("#context-text");
const clueList = document.querySelector("#clue-list");
const slots = Array.from(document.querySelectorAll(".slot"));
const combineButton = document.querySelector("#combine-button");
const inventory = [];
let selectedSlot = null;

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

document.querySelector(".lock").addEventListener("click", (event) => {
  updateContext("Cadeado", event.currentTarget.dataset.description);
  addClue("Talvez uma peça fina e uma empunhadura improvisada ajudem.");
});

slots.forEach((slot) => {
  slot.addEventListener("click", () => {
    if (!slot.classList.contains("filled")) {
      return;
    }

    slots.forEach((item) => item.classList.remove("selected"));
    slot.classList.add("selected");
    selectedSlot = slot.textContent;
    updateContext(selectedSlot, `Item selecionado: ${selectedSlot}.`);
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
