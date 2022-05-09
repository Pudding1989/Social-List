const API_List = "https://lighthouse-user-api.herokuapp.com/api/v1/users"
const API_User = API_List + "/"

const list = document.querySelector(".list-panel")
const modal = document.querySelector(".modal-content")
const pagination = document.querySelector('.pagination')

const searchInput = document.querySelector('#search-input')
const searchButton = document.querySelector('#search-button')
const close = document.querySelector('.close')

const toaster = document.querySelector('.toast-container')
const intro = document.querySelector('#intro')




//接收API資料，陣列是Pass by reference記得用const宣告
const listData = []

//跨函式傳遞設定值，用JSON暫存瀏覽狀態
let status = {
  data: 'listData',
  pageNumber: { list: 1, search: 1, friend: 1, searchFriend: 1 },
  amountOfPage: 20,
  friendData: [],
  keyword: '',
  keywordFriend: '',
  searchData: [],
  searchFriend: []
}


loadingPage(list)

//從Local Storage讀取並回復status
restoreStatus()

//主程式：透過API請求資料
axios.get(API_List).then(response => {
  listData.push(...response.data.results)
  //從status設定值，切換顯示狀態
  switch (status.data) {
    case 'searchData':
      searchInput.value = status.keyword
      renderSearch(status.searchData)
      renderCard(slicePage(status.searchData, getPageData(), status.amountOfPage))
      break
    case 'searchFriend':
      document.location.href = './friend.html'
    default:
      renderCard(slicePage(listData, getPageData(), status.amountOfPage))
      renderPagination(listData, status.amountOfPage)
      status.data = 'listData'
      //刪除提示toast
      !status.friendData.length ? (intro.classList.add('show'))(removeToast(intro, 3500)) : removeToast(intro, 0)
      break
  }
})



//監聽整個panel，用mouseover預先渲染
list.addEventListener('mouseover', event => {
  let click = event.target
  if (click.matches('.show-modal')) {
    let userId = click.dataset.bsId
    renderModal(userId)
  }
})


//監聽心型按鈕
list.addEventListener('mousedown', event => {
  if (event.target.matches('.far.fa-heart')) {
    addFriend(event.target)
  } else if (event.target.matches('.fas.fa-heart')) {
    removeFriend(event.target)
  }
  storageStatus()
})

//加好友
function addFriend(eventTarget) {
  //加入好友陣列
  const friend = listData.find(element => element.id === Number(eventTarget.dataset.id))
  status.friendData.push(friend)
  //空心換實心
  eventTarget.classList.remove('far')
  eventTarget.classList.add('fas')
}
//刪好友
function removeFriend(eventTarget) {
  //從好友陣列移除
  //處理例外狀況
  if (!status.friendData) return
  const friendIndex = status.friendData.findIndex(element => element.id === Number(eventTarget.dataset.id))
  if (friendIndex === -1) return
  //刪除好友
  renderToast(`你已經狠心的把 ${status.friendData[friendIndex].name} ${status.friendData[friendIndex].surname} 刪除好友了`)
  status.friendData.splice(friendIndex, 1)
  // 實心換空心
  eventTarget.classList.remove('fas')
  eventTarget.classList.add('far')
}


// 監聽搜尋按鈕
searchButton.addEventListener('click', event => {
  event.preventDefault()
  status.keyword = searchInput.value.trim().toLowerCase()
  searchResult(status.keyword)
  close.style.visibility = 'visible'
  close.classList.add('visible')
})

//用keyup即時搜尋
searchInput.addEventListener('keyup', () => {
  status.keyword = searchInput.value.trim().toLowerCase()
  searchResult(status.keyword)
  close.style.visibility = 'visible'
  close.classList.add('visible')
  storageStatus()
})

//監聽離開搜尋狀態按鈕
close.addEventListener('click', () => {
  status.data = 'listData'
  searchInput.classList.remove('is-invalid')
  close.classList.remove('visible')
  searchInput.value = ''
  storageStatus()
  renderCard(slicePage(listData, status.pageNumber.list, status.amountOfPage))
  renderPagination(listData, status.amountOfPage)
  setTimeout(() => {
    close.style.visibility = 'hidden'
  }, 800);

})


//監聽分頁器
pagination.addEventListener('click', event => {
  if (event.target.tagName !== 'A') return
  page = event.target.dataset.page
  console.log(`點擊第${page}頁`)
  //依資料來源，切換頁數設定值。將搜尋結果跟主頁面的當前頁數設定值分開。
  let pageNumber = getPageData()
  switch (page) {
    case undefined:
      break
    case 'previous':
      pageNumber--
      break
    case 'next':
      pageNumber++
      break
    default:
      pageNumber = Number(page)
      break
  }
  //依資料來源寫回對應頁數設定
  assignPageData(pageNumber)
  storageStatus()
  renderCard(slicePage(switchData(), pageNumber, status.amountOfPage))
  renderPagination(switchData(), status.amountOfPage)
})

//監聽關閉toast
toaster.addEventListener('click', event => {
  if (event.target.matches('.btn-close')) {
    removeToast(event.target.parentElement.parentElement, 0)
  }
})


//畫面渲染函式
//渲染Loading畫面
function loadingPage(node) {
  pagination.style.visibility = 'hidden'
  node.innerHTML = `
  <div class="loading">
      <div class="spinner-grow" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <h5>已經在讀取清單了呦～</h5>
    </div>
  `
}

//渲染卡片
function renderCard(data) {
  let templateHTML = ''
  data.forEach(element => {
    templateHTML += `
    <div class="user card">
          <img src="${element.avatar}" loading="lazy" alt="${element.name}的頭像">
          <div class="card-footer">
            <p>${element.name}<br>${element.surname}</p>
            <i class="${status.friendData.some(item => item.id === element.id) ? 'fas' : 'far'} fa-heart" data-id="${element.id}"></i>
            <button type="button" class="show-modal" data-bs-toggle="modal" data-bs-id="${element.id}" data-bs-target="#Modal">關於${element.gender === 'male' ? '他' : '她'}</button>
          </div>
        </div>
    `
    // console.log(`完成渲染 ${(element.id-600)/2}%的卡片`)
    return (element.id - 600) / 2
  })
  list.innerHTML = templateHTML
}

//渲染分頁器
function renderPagination(data, amountOfPage = 20) {
  pagination.style.visibility = 'visible'
  //依資料來源，切換頁數設定值。將搜尋結果跟主頁面的當前頁數設定值分開。
  let pageNumber = getPageData()
  const totalPage = Math.ceil(data.length / amountOfPage)
  // 上一頁
  let templateHTML = `
  <li class="page-item ${pageNumber === 1 ? 'disabled' : ''}"><a class="page-link" href="#" data-page="previous">上一頁</a></li>`
  // 數字頁
  for (let page = 1; page <= totalPage; page++) {
    templateHTML += `
    <li class="page-item ${pageNumber === page ? 'active' : ''}"><a class="page-link" href="#" data-page="${page}">${page}</a></li>
    `
  }
  // 下一頁
  templateHTML += `
  <li class="page-item ${pageNumber === totalPage ? 'disabled' : ''}"><a class="page-link" href="#" data-page="next">下一頁</a></li>
  `

  pagination.innerHTML = templateHTML
  //依資料來源寫回對應頁數設定
  assignPageData(pageNumber)
}

//渲染無效關鍵字畫面，有效關鍵字調用renderSearch處理
function searchResult(keyword) {
  switch (keyword.length) {
    case 0:
      searchInput.classList.add('is-invalid')
      list.innerHTML = `<div class="result"><h3 class="text-danger">欸～ 給個名字吧！<br>不然哪找的到啊😒😒～</h3></div>`
      pagination.style.visibility = 'hidden'
      break
    default:
      searchInput.classList.remove('is-invalid')
      status.searchData = filterName(keyword, listData)
      console.log(`共${status.searchData.length} 個搜尋結果`)
      renderSearch(status.searchData)
      break
  }
}
//渲染搜尋結果至卡片及分頁器
function renderSearch(data = status.searchData) {
  close.style.visibility = 'visible'
  close.classList.add('visible')
  switch (data.length) {
    case 0:
      pagination.style.visibility = 'hidden'
      list.innerHTML = `<div class="col-12 text-center mt-5"><h3 class="text-secondary">生命中那個對的人，總是會是晚到<br>但總有那麼一個人，會永遠等你</h3></div>`
      break
    default:
      status.data = 'searchData'
      status.pageNumber.search = 1
      renderCard(slicePage(data, status.pageNumber.search, status.amountOfPage))
      renderPagination(data)
      pagination.style.visibility = 'visible'
      break
  }
}

//向show API請求資料，渲染到modal裡
function renderModal(userId) {
  axios
    .get(API_User + userId)
    .then((response) => {
      // 接收API資料
      const user = response.data
      // 轉換成所需格式
      const birthdayString = formatBirthday(user.birthday)
      //將所有變數渲染成modal
      modal.innerHTML = `
  <div class="modal-header">
    <h5 class="modal-title" id="ModalLabel">${user.name} ${user.surname}</h5>${user.gender === 'male' ? '<i class="fas fa-mars"></i>' : '<i class="fas fa-venus"></i>'}
    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
  </div>
  <div class="modal-body container">
    <div class="row">
      <div class="col-4 col-md-4">
        <img src="https://flagcdn.com/56x42/${user.region.toLowerCase()}.png" alt="${user.region}的國旗" class="flag">
        <img src="${user.avatar}" alt="${user.name}的頭像" class="avatar">
      </div>
      <div class="col-8 col-md-8">
        <div><i class="fas fa-seedling"></i><p>${user.age} 歲</p></div>
        <div><i class="fas fa-birthday-cake"></i><p>${birthdayString}</p></div>
        <div><i class="fas fa-at"></i><p>${user.email}</p></div>
      </div>
    </div>
  </div>
  <div class="modal-footer">
    <button type="button" class="" data-bs-dismiss="modal">返回</button>
  </div>
    `
      console.log(`完成渲染 #${userId} modal`)
    })
}

//切割指定頁數的物件陣列
function slicePage(data, pageNumber = 1, amountOfPage = 20) {
  let startData = (pageNumber - 1) * amountOfPage
  return data.slice(startData, startData + amountOfPage)
}


//將Local Storage中不為null的值，寫回status物件
function restoreStatus() {
  const oldStatus = {}
  //讀取Local Storage
  for (let key in status) {
    oldStatus[key] = JSON.parse(localStorage.getItem(key))
  }
  //跳過缺少的值，寫回不為null的值
  for (let key in oldStatus) {
    if (oldStatus[key] !== null) status[key] = oldStatus[key]
  }
}
//把整個status丟到Local Storage
function storageStatus() {
  for (let key in status) {
    localStorage.setItem(key, JSON.stringify(status[key]))
  }
}


//切換對應設定值函式
// 分別處理不同資料來源的分頁功能
function switchData() {
  return status.data === 'searchData' ? status.searchData : listData
}

//依資料來源，讀取頁數設定值
function getPageData() {
  return status.data === 'searchData' ? status.pageNumber.search
    : status.pageNumber.list
}
//依資料來源，寫回頁數設定值
function assignPageData(pageNumber) {
  return status.data === 'searchData' ? status.pageNumber.search = pageNumber : status.pageNumber.list = pageNumber
}


//替換生日文字格式供modal使用
function formatBirthday(birthdayString) {
  let form = birthdayString.replace(/-/g, ' / ')
  return form
}

//搜尋姓＋名
function filterName(keyword, data) {
  return data.filter((element) => element.name.toLowerCase().includes(keyword) || element.surname.toLowerCase().includes(keyword))
}

function renderToast(context) {
  let templateHTML = `
        <div class="toast-header">
          <img src="https://cdn-icons-png.flaticon.com/512/4484/4484569.png" class="rounded me-2" alt="...">
          <strong class="me-auto">嘆嘆</strong>
          <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
        <div class="toast-body">
          ${context}
        </div>
  `
  const toast = document.createElement('div')
  // 自行建立 bootstrap toast 最外層div預設的class跟屬性
  toast.classList.add('toast', 'fade', 'show')
  toast.setAttribute('role', 'alert')
  toast.setAttribute('aria-live', 'alert')
  toast.setAttribute('aria-atomic', true)

  toast.innerHTML = templateHTML
  toaster.append(toast)
  removeToast(toast, 1500)
}

function removeToast(toast, delay = 1500) {
  setTimeout(() => {
    toast.classList.remove('show')
  }, delay)
  setTimeout(() => {
    toast.remove()
  }, delay + 200)
}

function clean() {
  localStorage.clear()
  console.log('已清除本機儲存空間')
  // 用toast 顯示清除訊息
  renderToast(`已經幫你清空所有資料囉～`)
  setTimeout(() => {
    renderToast('3秒後自動重新載入')
  }, 750)

  setTimeout(() => {
    window.location.reload()
  }, 3000)
}

// 開發者提示
console.log('親愛的開發者你好，本專案運用本機儲存空間來儲存資料\n你可以隨時透過下列方式，來操作這個網頁喔～')
console.log('1.輸入 clean()，清除本機儲存空間\n2.輸入renderToast(顯示文字)，顯示吐司訊息')
