import Phaser from "phaser";

export class GameScene extends Phaser.Scene {
  // Ссылки на объекты
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private interactKey!: Phaser.Input.Keyboard.Key;
  private testItem!: Phaser.Physics.Arcade.Sprite;

  // Состояние
  private inventory: string[] = [];
  private inventorySlots: Phaser.GameObjects.Rectangle[] = [];
  private inventoryTexts: Phaser.GameObjects.Text[] = [];

  constructor() {
    super({ key: "GameScene" });
  }

  preload() {
    // Пока ничего не загружаем, используем геометрические фигуры
    console.log("GameScene preload");
  }

  create() {
    console.log("GameScene create");

    // 1. СОЗДАЁМ ЗЕМЛЮ (платформа)
    const ground = this.physics.add.staticImage(400, 580, "__WHITE");
    ground.displayWidth = 800;
    ground.displayHeight = 20;
    ground.setTint(0x8b5a2b); // Коричневый цвет
    ground.refreshBody();

    // 2. СОЗДАЁМ ИГРОКА (зелёный квадрат)
    this.player = this.physics.add.sprite(100, 500, "__WHITE");
    this.player.setTint(0x2ecc2e); // Зелёный
    this.player.setDisplaySize(32, 32);
    this.player.setCollideWorldBounds(true);
    this.player.setBounce(0.2);

    // 3. НАСТРАИВАЕМ ФИЗИКУ
    this.physics.add.collider(this.player, ground);

    // 4. СОЗДАЁМ ТЕСТОВЫЙ ПРЕДМЕТ (жёлтый круг)
    this.testItem = this.physics.add.sprite(400, 550, "__WHITE");
    this.testItem.setTint(0xf1c40f); // Жёлтый
    this.testItem.setDisplaySize(20, 20);
    this.physics.add.collider(this.testItem, ground);

    // 5. НАСТРАИВАЕМ КЛАВИАТУРУ
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.interactKey = this.input.keyboard!.addKey(
      Phaser.Input.Keyboard.KeyCodes.E,
    );

    // 6. СОЗДАЁМ ИНВЕНТАРЬ (5 слотов вверху экрана)
    this.createInventoryUI();

    // 7. ДОБАВЛЯЕМ ТЕКСТ-ПОДСКАЗКУ
    this.add.text(
      10,
      10,
      "Стрелки / Пробел — движение\nE — подобрать предмет",
      {
        fontSize: "14px",
        color: "#ffffff",
        backgroundColor: "#00000080",
        padding: { x: 5, y: 5 },
      },
    );
  }

  update() {
    // УПРАВЛЕНИЕ: движение влево-вправо
    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-160);
      this.player.setFlipX(true);
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(160);
      this.player.setFlipX(false);
    } else {
      this.player.setVelocityX(0);
    }

    // ПРЫЖОК (только если на земле)
    if (this.cursors.space.isDown && this.player.body!.touching.down) {
      this.player.setVelocityY(-330);
    }

    // ВЗАИМОДЕЙСТВИЕ (кнопка E) — подбор предмета
    if (Phaser.Input.Keyboard.JustDown(this.interactKey)) {
      this.tryPickupItem();
    }
  }

  private createInventoryUI() {
    // Создаём 5 слотов в верхней части экрана
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

      // Текст для отображения содержимого слота (пока пусто)
      const text = this.add
        .text(x + slotWidth / 2, startY + slotHeight / 2, "", {
          fontSize: "16px",
          color: "#ffffff",
        })
        .setOrigin(0.5);
      this.inventoryTexts.push(text);
    }

    // Обновляем отображение инвентаря
    this.updateInventoryUI();
  }

  private updateInventoryUI() {
    for (let i = 0; i < 5; i++) {
      if (i < this.inventory.length) {
        // В слоте есть предмет — показываем первую букву
        const itemName = this.inventory[i];
        const firstLetter = itemName.charAt(0).toUpperCase();
        this.inventoryTexts[i].setText(firstLetter);
        this.inventoryTexts[i].setColor("#f1c40f");
      } else {
        // Пустой слот
        this.inventoryTexts[i].setText("·");
        this.inventoryTexts[i].setColor("#888888");
      }
    }
  }

  private tryPickupItem() {
    // Проверяем, находится ли игрок рядом с предметом
    const distance = Phaser.Math.Distance.Between(
      this.player.x,
      this.player.y,
      this.testItem.x,
      this.testItem.y,
    );

    if (distance < 50 && this.testItem.active) {
      // Подбираем предмет
      this.testItem.destroy();

      // Добавляем в инвентарь (если есть место)
      if (this.inventory.length < 5) {
        this.inventory.push("монета");
        console.log("Подобран предмет! Инвентарь:", this.inventory);
        this.updateInventoryUI();
      } else {
        console.log("Инвентарь полон!");
        // Покажем временное сообщение
        const msg = this.add
          .text(400, 300, "Инвентарь полон!", {
            fontSize: "20px",
            color: "#ff0000",
            backgroundColor: "#000000",
          })
          .setOrigin(0.5);
        this.time.delayedCall(1000, () => msg.destroy());
      }
    }
  }
}
