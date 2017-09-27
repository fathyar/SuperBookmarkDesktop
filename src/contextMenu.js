/* global chrome, idbKeyval, app */
{
    const {openBookmarkProperties, openDesktopProperties} = app;
    const {getUiElements, show, hide, getParentElementWithClass, getDataset} = app.util;

    const contextMenu = document.createElement('div');
    contextMenu.className = 'contextMenu';
    contextMenu.innerHTML = `
        <div class="contextMenuItem" data-id="newTab">Open link in new tab</div>
        <div class="contextMenuItem" data-id="newWindow">Open link in new window</div>
        <div class="contextMenuItem" data-id="incog">Open link in incognito window</div>
        <div class="contextMenuSeperator" data-id="sep"></div>
        <div class="contextMenuItem" data-id="createBookmark">Create Bookmark</div>
        <div class="contextMenuItem" data-id="createFolder">Create Folder</div>
        <div class="contextMenuItem" data-id="createDocument">Create Document</div>
        <div class="contextMenuItem" data-id="delete">Delete</div>
        <div class="contextMenuItem" data-id="properties">Properties</div>
    `;

    const ui = getUiElements(contextMenu);
    let context;

    ui.newTab.addEventListener('click', () => {
        const url = context.dataset.url;
        chrome.tabs.create({url});
        hide(contextMenu);
    });

    ui.newWindow.addEventListener('click', () => {
        const url = context.dataset.url;
        chrome.windows.create({url, state: 'maximized'});
        hide(contextMenu);
    });

    ui.incog.addEventListener('click', () => {
        const url = context.dataset.url;
        chrome.windows.create({url, state: 'maximized', incognito: true});
        hide(contextMenu);
    });

    ui.createBookmark.addEventListener('click', () => {
        chrome.bookmarks.create({
            parentId: context.dataset.id,
            title: 'New Bookmark',
            url: 'about:blank'
        });
        app.saveData();
        hide(contextMenu);
    });

    ui.createFolder.addEventListener('click', () => {
        chrome.bookmarks.create({
            parentId: context.dataset.id,
            title: 'New Folder'
        });
        app.saveData();
        hide(contextMenu);
    });

    ui.createDocument.addEventListener('click', () => {
        chrome.bookmarks.create({
            parentId: context.dataset.id,
            title: 'New Document',
            //btoa(unescape(encodeURIComponent('<!--sbd-doc-->')))
            url: 'data:text/html;charset=UTF-8;base64,PCEtLXNiZC1kb2MtLT4='
        });
        app.saveData();
        hide(contextMenu);
    });

    ui.delete.addEventListener('click', async () => {
        hide(contextMenu);
        const confirmBtns = [
            'Do It!',
            {text: 'No Way!', value: false, default: true}
        ];
        const icon = getDataset(context);
        const iconId = icon.id + ''; // must be string
        const thing = icon.folder ? 'folder' : 'bookmark';
        if (await app.confirm(`Really? Delete this ${thing}?`, confirmBtns)) {
            app.ignoreNextRender = true;
            if (icon.folder) {
                chrome.bookmarks.removeTree(iconId);
            } else {
                chrome.bookmarks.remove(iconId);
            }
            idbKeyval.delete(iconId);
            context.parentElement.removeChild(context);
            app.saveData();
        }
    });

    ui.properties.addEventListener('click', () => {
        if (context.classList.contains('bookmark')) {
            openBookmarkProperties(context);
        } else {
            openDesktopProperties();
        }
        hide(contextMenu);
    });

    const populateMenu = (targetEl) => {
        Object.keys(ui).forEach((key) => hide(ui[key]));
        if (targetEl.classList.contains('bookmark')) {
            const icon = getDataset(targetEl);
            context = targetEl;
            if (!icon.folder) {
                show(ui.newTab);
                show(ui.newWindow);
                show(ui.incog);
                show(ui.sep);
            }
            show(ui.delete);
        } else {
            context = getParentElementWithClass(targetEl, ['desktop', 'window']);
            show(ui.createBookmark);
            show(ui.createFolder);
            show(ui.createDocument);
        }
        show(ui.properties);
    };

    window.addEventListener('contextmenu', (e) => {
        const targetEl = getParentElementWithClass(e.target, ['bookmark', 'desktop', 'window']);
        if (targetEl) {
            e.preventDefault();
            populateMenu(targetEl);
            show(contextMenu);
            let x = e.pageX;
            let y = e.pageY;
            if (e.clientX + contextMenu.offsetWidth > window.innerWidth) {
                x -= contextMenu.offsetWidth;
            }
            if (e.clientY + contextMenu.offsetHeight > window.innerHeight) {
                y -= contextMenu.offsetHeight;
            }
            contextMenu.style.left = x + 'px';
            contextMenu.style.top = y + 'px';
            return false;
        }
    });

    window.addEventListener('mousedown', (e) => {
        if (!getParentElementWithClass(e.target, 'contextMenu')) {
            hide(contextMenu);
        }
    });

    document.body.appendChild(contextMenu);
}
