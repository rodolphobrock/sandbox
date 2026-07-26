# Pendrive Ventoy customizado — Dell OptiPlex Micro Plus 7020 + Windows 11 Pro pt-BR

Guia completo para montar um pendrive Ventoy com instalação automatizada
(unattended) do Windows 11 Pro em português do Brasil, ajustado para o
Dell OptiPlex Micro Plus 7020 (Intel Core 14ª geração, TPM 2.0, NVMe).

## O que você vai precisar

- Pendrive de **16 GB ou mais** (USB 3.0 recomendado — a instalação fica bem mais rápida)
- ISO oficial do Windows 11 pt-BR: <https://www.microsoft.com/pt-br/software-download/windows11>
  (opção "Baixar imagem de disco (ISO) do Windows 11" → idioma **Português (Brasil)**)
- Ventoy: <https://www.ventoy.net/en/download.html> (versão 1.0.96 ou superior)
- Os arquivos desta pasta (`ventoy/`)

## Passo 1 — Instalar o Ventoy no pendrive

**Windows:** extraia o zip do Ventoy, execute `Ventoy2Disk.exe`, selecione o
pendrive e clique em **Install** (isso apaga todo o conteúdo do pendrive).
Em *Option → Partition Style*, escolha **GPT** (o 7020 usa UEFI puro).

**Linux:**

```bash
sudo sh Ventoy2Disk.sh -i -g /dev/sdX   # -g = GPT; troque sdX pelo seu pendrive
```

Após a instalação, o pendrive terá uma partição grande (exFAT) chamada `Ventoy`.

## Passo 2 — Copiar os arquivos

Na partição `Ventoy` do pendrive, monte esta estrutura:

```text
Ventoy/
├── ISO/
│   └── Win11_24H2_BrazilianPortuguese_x64.iso   ← a ISO que você baixou
└── ventoy/
    ├── ventoy.json                              ← desta pasta
    └── script/
        └── autounattend-win11-pro-ptbr.xml      ← desta pasta
```

> Se o nome do seu arquivo ISO for diferente, edite o campo `image` dentro do
> `ventoy/ventoy.json` para bater exatamente com o nome real (o caminho é
> case-sensitive).

**Antes de usar, edite o `autounattend-win11-pro-ptbr.xml`** e ajuste:

- `NOME-DO-PC` → nome de máquina desejado (máx. 15 caracteres, sem espaço/acento)
- `Usuario` / `TroqueEstaSenha123` → usuário e senha da conta local que será criada

## Passo 3 — Configurar a BIOS do 7020

Ligue o micro pressionando **F2** para entrar na BIOS:

1. **Storage → SATA/NVMe Operation**: mude de `RAID On` para **`AHCI/NVMe`**.
   Com `RAID On` (padrão de fábrica da Dell), o instalador do Windows **não
   enxerga o SSD NVMe** sem o driver Intel RST. Mudar para AHCI/NVMe resolve.
   ⚠️ Se já existe um Windows instalado que você quer manter, não mude — nesse
   caso use a alternativa com driver IRST descrita no fim deste guia.
2. **Boot Configuration → Secure Boot**: pode deixar **ligado**. O Ventoy
   suporta Secure Boot, mas no primeiro boot vai aparecer a tela azul do
   **MOK Manager**: escolha `Enroll key from disk` → `VTOYEFI` →
   `ENROLL_THIS_KEY_IN_MOKMANAGER.cer` → confirme e reinicie.
   (Se preferir, desligue o Secure Boot e religue depois da instalação.)
3. Salve com **Apply → Exit**.

## Passo 4 — Boot e instalação

1. Espete o pendrive e ligue o micro pressionando **F12** (menu de boot).
2. Escolha o pendrive na seção **UEFI Boot**.
3. No menu do Ventoy, selecione a ISO do Windows 11 e dê Enter
   (modo `Boot in normal mode`).
4. O Ventoy pergunta se deseja usar o template de instalação automática —
   confirme. Dali em diante a instalação segue sozinha em pt-BR:
   - Edição **Windows 11 Pro** selecionada automaticamente
   - Idioma, formato e **teclado ABNT2** já configurados
   - Fuso horário de **Brasília (E. South America Standard Time)**
   - OOBE pulada: cria a conta local definida no XML, sem exigir conta Microsoft
5. **Única etapa manual:** a seleção do disco/partição de destino. Foi deixada
   manual de propósito para não haver risco de apagar o disco errado. Selecione
   o NVMe, apague as partições antigas (se for instalação limpa) e avance.

## Passo 5 — Pós-instalação

O 7020 Micro Plus é totalmente compatível com Windows 11 (TPM 2.0 nativo),
então não há bypass de requisitos envolvido. Depois do primeiro login:

1. Conecte o cabo de rede (Intel I219-LM funciona nativamente na ISO 24H2;
   o Wi-Fi Intel AX211, se equipado, também).
2. Instale o **Dell Command | Update**:
   <https://www.dell.com/support/home/pt-br> → digite o Service Tag →
   Drivers e Downloads. Ele baixa e instala todos os drivers/firmwares
   específicos do 7020 (chipset, Intel ME, áudio Realtek, BIOS etc.).
3. Rode o Windows Update até não sobrar nada.
4. Ativação: se o micro veio com licença Windows 11 Pro OEM da Dell, a chave
   está gravada na placa (ACPI/MSDM) e a ativação digital ocorre sozinha ao
   conectar na internet. A chave genérica usada no XML serve apenas para
   selecionar a edição Pro durante o setup — ela não ativa o Windows.

## Alternativa: manter RAID On (driver Intel RST)

Se não puder mudar a BIOS para AHCI/NVMe:

1. Baixe o driver **Intel Rapid Storage Technology (F6 / pre-OS)** na página
   de drivers do 7020 no site da Dell (categoria *Serial ATA*).
2. Extraia e copie a pasta do driver para a raiz do pendrive
   (ex.: `Ventoy/drivers/irst/`).
3. Durante o setup, na tela de seleção de disco, clique em
   **Carregar driver → Procurar** e aponte para essa pasta. O NVMe aparece
   e a instalação segue normalmente.

## Extras do Ventoy que valem conhecer

- Pode colocar **várias ISOs** no mesmo pendrive (Linux, ferramentas de
  diagnóstico Dell SupportAssist/ePSA, GParted etc.) — o menu lista todas.
- Para atualizar o Ventoy sem apagar as ISOs: `Ventoy2Disk` → **Update**.
- Documentação dos plugins usados aqui:
  - auto_install: <https://www.ventoy.net/en/plugin_autoinstall.html>
  - control: <https://www.ventoy.net/en/plugin_control.html>
