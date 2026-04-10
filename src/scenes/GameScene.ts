import Phaser from "phaser";
import { Item } from "../objects/Item";
import { ITEMS, ItemData } from "../types/ItemTypes";

export class GameScene extends Phaser.Scene {
  // Ссылки на объекты
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private interactKey!: Phaser.Input.Keyboard.Key;
  private ground!: Phaser.Physics.Arcade.StaticImage;

  // Система предметов
  private items: Item[] = [];
  private availableItems: { x: number; y: number; itemId: string }[] = [];

  // Инвентарь
  private inventory: { itemId: string; itemData: ItemData }[] = [];
  private currentWeight: number = 0;
  private maxWeight: number = 10;

  // UI элементы
  private inventorySlots: Phaser.GameObjects.Rectangle[] = [];
  private inventoryTexts: Phaser.GameObjects.Text[] = [];
  private weightText!: Phaser.GameObjects.Text;
  private messageText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: "GameScene" });
  }

  preload() {
    console.log("GameScene preload");
  }

  create() {
    console.log("GameScene create");

    // 1. СОЗДАЁМ ЗЕМЛЮ
    this.createGround();

    // 2. СОЗДАЁМ ИГРОКА
    this.createPlayer();

    // 3. НАСТРАИВАЕМ КЛАВИАТУРУ
    this.setupKeyboard();

    // 4. СОЗДАЁМ ПРЕДМЕТЫ
    this.createItems();

    // 5. СОЗДАЁМ UI
    this.createUI();

    // 6. НАСТРАИВАЕМ КОЛЛИЗИИ
    this.setupCollisions();

    // 7. ДОБАВЛЯЕМ ПОДСКАЗКУ
    this.addHelpText();
  }

  update() {
    this.handlePlayerMovement();
    this.handleJump();
    this.handleInteraction();
  }

  // ========== ИНИЦИАЛИЗАЦИЯ ==========

  private createGround(): void {
    this.ground = this.physics.add.staticImage(400, 580, "__WHITE");
    this.ground.displayWidth = 800;
    this.ground.displayHeight = 20;
    this.ground.setTint(0x8b5a2b);
    this.ground.refreshBody();
  }

  private createPlayer(): void {
    this.player = this.physics.add.sprite(100, 500, "__WHITE");
    this.player.setTint(0x2ecc2e);
    this.player.setDisplaySize(32, 32);
    this.player.setCollideWorldBounds(true);
    this.player.setBounce(0.2);

    // Ограничиваем падение
    this.player.body!.maxVelocity.y = 600;
  }

  private setupKeyboard(): void {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.interactKey = this.input.keyboard!.addKey(
      Phaser.Input.Keyboard.KeyCodes.E,
    );
  }

  private createItems(): void {
    // Определяем позиции и типы предметов
    const itemsToSpawn = [
      { x: 200, y: 550, itemId: "coin" },
      { x: 350, y: 550, itemId: "gem" },
      { x: 500, y: 550, itemId: "key" },
      { x: 650, y: 550, itemId: "potion" },
      { x: 750, y: 550, itemId: "crystal" },
    ];

    itemsToSpawn.forEach((spawn) => {
      const itemData = ITEMS[spawn.itemId];
      if (itemData) {
        const item = new Item(this, spawn.x, spawn.y, itemData);
        this.items.push(item);
        this.physics.add.collider(item, this.ground);
      }
    });
  }

  private createUI(): void {
    this.createInventorySlots();
    this.createWeightDisplay();
    this.createMessageDisplay();
  }

  private createInventorySlots(): void {
    const slotWidth = 50;
    const slotHeight = 50;
    const startX = this.cameras.main.width / 2 - (slotWidth * 5) / 2;
    const startY = 10;

    for (let i = 0; i < 5; i++) {
      const x = startX + i * (slotWidth + 5);
      const slot = this.add.rectangle(
        x,
        startY,
        slotWidth,
        slotHeight,
        0x333333,
      );
      slot.setStrokeStyle(2, 0x888888);
      this.inventorySlots.push(slot);

      const text = this.add
        .text(x, startY, "", {
          fontSize: "18px",
          fontFamily: "monospace",
          color: "#ffffff",
        })
        .setOrigin(0.5);
      this.inventoryTexts.push(text);
    }

    this.updateInventoryUI();
  }

  private createWeightDisplay(): void {
    this.weightText = this.add.text(10, 70, `Вес: 0/${this.maxWeight}`, {
      fontSize: "16px",
      fontFamily: "monospace",
      color: "#ffffff",
      backgroundColor: "#00000080",
      padding: { x: 5, y: 3 },
    });
  }

  private createMessageDisplay(): void {
    this.messageText = this.add
      .text(400, 550, "", {
        fontSize: "18px",
        fontFamily: "monospace",
        color: "#ffffff",
        backgroundColor: "#00000080",
        padding: { x: 10, y: 5 },
      })
      .setOrigin(0.5);
    this.messageText.setVisible(false);
  }

  private addHelpText(): void {
    this.add.text(
      10,
      10,
      "Стрелки / Пробел — движение\nE — подобрать предмет\nВес инвентаря ≤ 10",
      {
        fontSize: "12px",
        fontFamily: "monospace",
        color: "#ffffff",
        backgroundColor: "#00000080",
        padding: { x: 5, y: 5 },
      },
    );
  }

  private setupCollisions(): void {
    this.physics.add.collider(this.player, this.ground);

    // Коллизии игрока с предметами (для триггера)
    this.items.forEach((item) => {
      this.physics.add.collider(this.player, item);
    });
  }

  // ========== УПРАВЛЕНИЕ ==========

  private handlePlayerMovement(): void {
    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-160);
      this.player.setFlipX(true);
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(160);
      this.player.setFlipX(false);
    } else {
      this.player.setVelocityX(0);
    }
  }

  private handleJump(): void {
    if (this.cursors.space.isDown && this.player.body!.touching.down) {
      this.player.setVelocityY(-330);
    }
  }

  private handleInteraction(): void {
    if (Phaser.Input.Keyboard.JustDown(this.interactKey)) {
      this.tryPickupNearestItem();
    }
  }

  // ========== ИНВЕНТАРЬ ==========

  private tryPickupNearestItem(): void {
    let nearestItem: Item | null = null;
    let minDistance = 60; // Радиус подбора

    for (const item of this.items) {
      if (!item.active) continue;

      const distance = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        item.x,
        item.y,
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearestItem = item;
      }
    }

    if (nearestItem) {
      this.pickupItem(nearestItem);
    } else {
      this.showMessage("Нет предметов рядом", 0xffaa00);
    }
  }

  private pickupItem(item: Item): void {
    const itemWeight = item.itemData.weight;

    // Проверяем, не превысит ли вес лимит
    if (this.currentWeight + itemWeight > this.maxWeight) {
      this.showMessage(
        `Слишком тяжело! Вес: ${this.currentWeight}/${this.maxWeight}`,
        0xff5555,
      );
      return;
    }

    // Добавляем в инвентарь
    this.inventory.push({
      itemId: item.itemData.id,
      itemData: item.itemData,
    });
    this.currentWeight += itemWeight;

    // Визуальный эффект подбора
    item.pickup();

    // Удаляем из массива активных предметов
    const itemIndex = this.items.indexOf(item);
    if (itemIndex !== -1) {
      this.items.splice(itemIndex, 1);
    }

    // Обновляем UI
    this.updateInventoryUI();
    this.updateWeightDisplay();
    this.showMessage(
      `Подобран: ${item.itemData.name} (+${itemWeight} вес)`,
      0x66ff66,
    );

    // Через 5 секунд возрождаем предмет (если хотим)
    this.scheduleItemRespawn(item);
  }

  private scheduleItemRespawn(item: Item): void {
    // Сохраняем позицию и тип для возрождения
    const respawnX = item.x;
    const respawnY = item.y;
    const itemId = item.itemData.id;

    this.time.delayedCall(8000, () => {
      // Проверяем, нет ли уже предмета на этом месте
      const existingItem = this.items.find(
        (i) => Math.abs(i.x - respawnX) < 10 && Math.abs(i.y - respawnY) < 10,
      );

      if (!existingItem) {
        const itemData = ITEMS[itemId];
        if (itemData) {
          const newItem = new Item(this, respawnX, respawnY, itemData);
          this.items.push(newItem);
          this.physics.add.collider(newItem, this.ground);
          this.physics.add.collider(this.player, newItem);
          console.log(`Предмет ${itemId} возродился`);
        }
      }
    });
  }

  // ========== UI ОБНОВЛЕНИЯ ==========

  private updateInventoryUI(): void {
    // Очищаем слоты
    for (let i = 0; i < 5; i++) {
      this.inventoryTexts[i].setText("");
      this.inventorySlots[i].setStrokeStyle(2, 0x888888);
    }

    // Заполняем слоты из инвентаря
    for (let i = 0; i < this.inventory.length && i < 5; i++) {
      const item = this.inventory[i];
      this.inventoryTexts[i].setText(item.itemData.iconLetter);
      this.inventoryTexts[i].setColor("#f1c40f");
      this.inventorySlots[i].setStrokeStyle(2, 0xf1c40f);
    }
  }

  private updateWeightDisplay(): void {
    this.weightText.setText(`Вес: ${this.currentWeight}/${this.maxWeight}`);

    // Меняем цвет при приближении к лимиту
    if (this.currentWeight >= this.maxWeight) {
      this.weightText.setColor("#ff5555");
    } else if (this.currentWeight >= this.maxWeight * 0.8) {
      this.weightText.setColor("#ffaa55");
    } else {
      this.weightText.setColor("#ffffff");
    }
  }

  private showMessage(text: string, color: number = 0xffffff): void {
    this.messageText.setText(text);
    this.messageText.setColor(`#${color.toString(16)}`);
    this.messageText.setVisible(true);

    this.time.delayedCall(2000, () => {
      this.messageText.setVisible(false);
    });
  }
}
