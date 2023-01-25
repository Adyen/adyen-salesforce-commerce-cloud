const draggableList = document.getElementById('draggable-list');

const dataItems = [
  {
    id: 'applepay',
    name: 'ApplePayExpress_Enabled',
    text: 'Apple Pay',
    icon: window.applePayIcon,
    checked: window.isApplePayEnabled,
  },
  {
    id: 'amazonpay',
    name: 'AmazonPayExpress_Enabled',
    text: 'Amazon Pay',
    icon: window.amazonPayIcon,
    checked: window.isAmazonPayEnabled,
  },
];

const listItems = [];

let dragStartIndex;

function swapItems(fromIndex, toIndex) {
  const itemOne = listItems[fromIndex].querySelector('.draggable');
  const itemTwo = listItems[toIndex].querySelector('.draggable');

  listItems[fromIndex].appendChild(itemTwo);
  listItems[toIndex].appendChild(itemOne);
}

function dragStart() {
  dragStartIndex = +this.closest('li').getAttribute('data-index');
}

function dragDrop() {
  const dragEndIndex = +this.getAttribute('data-index');
  swapItems(dragStartIndex, dragEndIndex);
  this.classList.remove('over');
}

function dragEnter() {
  this.classList.add('over');
}

function dragLeave() {
  this.classList.remove('over');
}

function dragOver(e) {
  e.preventDefault();
}

function addEventListeners() {
  const draggables = document.querySelectorAll('.draggable');
  const dragListItems = document.querySelectorAll('.draggable-list li');

  draggables.forEach((draggable) => {
    draggable.addEventListener('dragstart', dragStart);
  });

  dragListItems.forEach((item) => {
    item.addEventListener('dragover', dragOver);
    item.addEventListener('drop', dragDrop);
    item.addEventListener('dragenter', dragEnter);
    item.addEventListener('dragleave', dragLeave);
  });
}

function createList() {
  dataItems.forEach((item, index) => {
    const listItem = document.createElement('li');

    listItem.setAttribute('data-index', index);

    listItem.innerHTML = `
        <div class="draggable" draggable="true">
          <div class="title">
            <img src="${window.dragIcon}" width="20" height="15" alt="" />
            <img class="logo" 
                src="${item.icon}" 
                width="40" 
                height="26" 
                alt="" 
            />
            <p class="item">${item.text}</p>
          </div>
          <div class="switch-button">
              <div class="form-check form-switch">
                 <input class="form-check-input" 
                        type="checkbox" 
                        name="${item.name}" 
                        id="${item.id}"
                        ${item.checked ? 'checked' : 'unchecked'}
                 >
              </div>
           </div>
        </div>
      `;

    listItems.push(listItem);

    draggableList.appendChild(listItem);
  });

  addEventListeners();
}

createList();
