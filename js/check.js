document.addEventListener('DOMContentLoaded', function() {
  // 获取元素
  const modal = document.getElementById('verify-modal');
  const modalContainer = modal.querySelector('.verify-container');
  const closeBtn = document.getElementById('close-verify');
  const puzzleImg = document.getElementById('puzzle-img');
  const puzzlePiece = document.getElementById('puzzle-piece');
  const refreshBtn = document.getElementById('refresh-puzzle');
  const sliderTrack = document.getElementById('slider-track');
  const slider = document.getElementById('slider');
  const verifyMessage = document.getElementById('verify-message');
  const downloadBtns = [
    document.getElementById('download-1'),
    document.getElementById('download-2'),
    document.getElementById('download-3')
  ];
  
  // 目标链接
  const targetUrls = [
    'https://workdrive.zohopublic.com.cn/embed/tfj1o941df05842824716bf12ea0ebf2cd877?toolbar=false&layout=list&appearance=light&themecolor=green&dateFormat=YYYY-MM-DD" scrolling="no" frameborder="0" allowfullscreen="true" width="1000" height="700" title="嵌入的代码"></iframe>',
    'https://workdrive.zohopublic.com.cn/embed/tfj1o9319413ec5cf4f65859e190e99d3e72c?toolbar=false&layout=list&appearance=light&themecolor=green&dateFormat=YYYY-MM-DD" scrolling="no" frameborder="0" allowfullscreen="true" width="1000" height="700" title="嵌入的代码"></iframe>', // 第二个按钮的默认链接
    ''
  ];
  
  // 状态变量
  let currentTargetUrl = '';
  let isDragging = false;
  let startX = 0;
  let currentX = 0;
  let gapLeft = 0;
  let gapTop = 0;
  let imageUrl = '';
  let puzzleContainer = document.querySelector('.puzzle-image');
  let containerWidth = 0;
  let containerHeight = 0;
  let puzzleSize = 50; // 拼图块默认大小

  // 新增：滑块/拼图映射相关变量
  let sliderMax = 0;
  let puzzleMax = 0;
  let expectedSliderLeft = 0; // slider 对应 gapLeft 的目标位置（基于比例）
  
  // 初始化加载指示器
  function initLoadingIndicator() {
    let loadingIndicator = document.querySelector('.loading-indicator');
    if (!loadingIndicator) {
      loadingIndicator = document.createElement('div');
      loadingIndicator.className = 'loading-indicator';
      loadingIndicator.innerHTML = '<div class="loading-spinner"></div>';
      puzzleContainer.appendChild(loadingIndicator);
    }
    loadingIndicator.style.opacity = '1';
    return loadingIndicator;
  }
  
  // 生成随机数
  function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  
  // 计算容器尺寸并设置响应式拼图大小
  function calculateContainerDimensions() {
    containerWidth = puzzleContainer.offsetWidth;
    containerHeight = puzzleContainer.offsetHeight;
    
    // sliderTrack 可能在 DOM 中尚未渲染宽度，保护性读取
    const trackWidth = sliderTrack ? sliderTrack.offsetWidth : 0;
    const sliderWidth = slider ? slider.offsetWidth : 0;
    
    // 根据容器宽度调整拼图大小（保持比例）
    const newPuzzleSize = Math.max(40, Math.min(60, Math.floor(containerWidth / 8)));
    if (newPuzzleSize !== puzzleSize) {
      puzzleSize = newPuzzleSize;
      puzzlePiece.style.width = `${puzzleSize}px`;
      puzzlePiece.style.height = `${puzzleSize}px`;
      
      // 更新缺口样式
      const gapElements = document.querySelectorAll('.puzzle-gap');
      gapElements.forEach(gap => {
        gap.style.width = `${puzzleSize}px`;
        gap.style.height = `${puzzleSize}px`;
      });
    }

    // 计算映射极值
    sliderMax = Math.max(1, trackWidth - sliderWidth);
    puzzleMax = Math.max(1, containerWidth - puzzleSize);
  }
  
  // 初始化拼图（先创建缺口和滑块位置，再加载图片）
  function initPuzzle() {
    // 显示加载指示器
    const loadingIndicator = initLoadingIndicator();
    
    // 重置状态
    slider.style.left = '0px';
    slider.classList.remove('success');
    slider.classList.remove('dragging');
    puzzlePiece.classList.remove('dragging', 'attached');
    verifyMessage.textContent = '右滑验证';
    verifyMessage.className = 'verify-message';
    sliderTrack.classList.remove('active');
    sliderTrack.style.setProperty('--fill-width', '0px'); // 新增：重置填充宽度
    puzzleImg.classList.remove('loaded');
    
    // 计算容器尺寸
    calculateContainerDimensions();
    
    // 先创建缺口位置（即使图片未加载也显示）
    createGap(true);
    
    // 生成随机图片
    const randomSeed = Math.floor(Math.random() * 1000);
    imageUrl = `https://picsum.photos/1600/900?${randomSeed}&nature,animal,cat,rain,city,girl,starry`;
    
    // 预加载图片
    const tempImg = new Image();
    tempImg.src = imageUrl;
    
    tempImg.onload = function() {
      // 图片加载完成后再设置src，避免闪烁
      puzzleImg.src = imageUrl;
      
      // 等待图片实际渲染完成
      puzzleImg.onload = function() {
        puzzleImg.classList.add('loaded');
        
        // 隐藏加载指示器
        setTimeout(() => {
          loadingIndicator.style.opacity = '0';
          setTimeout(() => loadingIndicator.remove(), 300);
        }, 300);
        
        // 设置拼图块背景（按容器尺寸）
        puzzlePiece.style.backgroundImage = `url(${imageUrl})`;
        puzzlePiece.style.backgroundSize = `${containerWidth}px ${containerHeight}px`;
        puzzlePiece.style.backgroundPosition = `-${gapLeft}px -${gapTop}px`;
      };
    };
    
    tempImg.onerror = function() {
      // 图片加载失败时重试（短延迟）
      setTimeout(initPuzzle, 1000);
    };
  }
  
  // 创建缺口
  function createGap(forceRandom = false) {
    // 移除已有的缺口
    const existingGap = document.querySelector('.puzzle-gap');
    if (existingGap) {
      existingGap.remove();
    }
    
    // 只有在需要时重新计算缺口位置
    if (forceRandom || gapLeft === 0) {
      // 计算缺口位置（确保在合理范围内）
      calculateContainerDimensions();
      gapLeft = getRandomInt(puzzleSize, Math.max(puzzleSize + 10, containerWidth - puzzleSize * 2));
      gapTop = getRandomInt(puzzleSize, Math.max(puzzleSize + 10, containerHeight - puzzleSize * 2));
    }
    
    // 更新映射目标（把拼图缺口位置映射到 slider 范围）
    // 避免除以 0，使用预先计算的 sliderMax / puzzleMax
    expectedSliderLeft = Math.round((gapLeft / puzzleMax) * sliderMax);

    // 设置拼图块初始位置（左侧起点），显示于容器左侧
    puzzlePiece.style.left = '0px';
    puzzlePiece.style.top = `${gapTop}px`;
    
    // 创建新缺口
    const gap = document.createElement('div');
    gap.className = 'puzzle-gap';
    gap.style.left = `${gapLeft}px`;
    gap.style.top = `${gapTop}px`;
    gap.style.width = `${puzzleSize}px`;
    gap.style.height = `${puzzleSize}px`;
    puzzleContainer.appendChild(gap);
  }
  
  // 验证是否成功（优化算法，考虑不同尺寸下的误差范围）
  function verifySuccess(mappedPuzzleLeft) {
    // mappedPuzzleLeft 是拼图端的当前左偏（0..puzzleMax）
    const tolerance = Math.max(4, Math.floor(puzzleSize / 8)); // 容差基于拼图大小
    return Math.abs(mappedPuzzleLeft - gapLeft) <= tolerance;
  }
  
  // 显示弹窗
  function showModal(url) {
    currentTargetUrl = url;
    modal.style.display = 'flex';
    // 触发重排后添加动画类
    setTimeout(() => {
      modalContainer.classList.add('active');
    }, 10);
    initPuzzle();
  }
  
  // 隐藏弹窗
  function hideModal() {
    modalContainer.classList.remove('active');
    setTimeout(() => {
      modal.style.display = 'none';
    }, 300);
  }
  
  // 下载按钮点击事件
  downloadBtns.forEach((btn, index) => {
    if (btn) {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        showModal(targetUrls[index]);
      });
    }
  });
  
  // 关闭按钮点击事件
  closeBtn.addEventListener('click', hideModal);
  
  // 点击弹窗外部关闭
  modal.addEventListener('click', function(e) {
    if (e.target === modal) {
      hideModal();
    }
  });
  
  // 刷新按钮点击事件
  refreshBtn.addEventListener('click', function() {
    this.classList.add('fa-spin');
    setTimeout(() => {
      this.classList.remove('fa-spin');
      initPuzzle();
    }, 500);
  });
  
  // 滑块鼠标按下事件
  slider.addEventListener('mousedown', startDrag);
  
  // 鼠标移动事件
  document.addEventListener('mousemove', dragMove);
  
  // 鼠标释放事件
  document.addEventListener('mouseup', endDrag);
  
  // 触摸事件支持（移动端）
  slider.addEventListener('touchstart', startDrag);
  document.addEventListener('touchmove', dragMove);
  document.addEventListener('touchend', endDrag);
  
  // 开始拖动
  function startDrag(e) {
    e.preventDefault();
    isDragging = true;
    
    // 获取起始位置（兼容鼠标和触摸事件）
    if (e.type === 'touchstart') {
      startX = e.touches[0].clientX;
    } else {
      startX = e.clientX;
    }
    
    currentX = parseInt(slider.style.left) || 0;
    slider.style.transition = 'none';
    verifyMessage.textContent = '右滑验证';
    verifyMessage.className = 'verify-message';
    sliderTrack.classList.add('active');

    // 视觉效果：滑块与拼图块进入拖动状态
    slider.classList.add('dragging');
    puzzlePiece.classList.add('dragging');

    // 初始化轨道填充
    const initFill = (parseInt(slider.style.left) || 0) + (slider.offsetWidth / 2);
    sliderTrack.style.setProperty('--fill-width', `${initFill}px`);
  }
  
  // 拖动中
  function dragMove(e) {
    if (!isDragging) return;
    e.preventDefault();
    
    // 计算移动距离（兼容鼠标和触摸事件）
    let clientX;
    if (e.type === 'touchmove') {
      clientX = e.touches[0].clientX;
    } else {
      clientX = e.clientX;
    }
    
    const moveX = clientX - startX;
    let newLeft = currentX + moveX;
    
    // 限制滑块范围
    if (newLeft < 0) newLeft = 0;
    if (newLeft > sliderMax) newLeft = sliderMax;
    
    // 更新滑块位置（slider）
    slider.style.left = `${newLeft}px`;

    // 将 slider 的位置映射到拼图移动范围
    const mappedPuzzleLeft = Math.round((newLeft / Math.max(1, sliderMax)) * puzzleMax);
    puzzlePiece.style.left = `${mappedPuzzleLeft}px`;

    // 更新滑轨填充宽度（以滑块中心为准）
    const fillWidth = newLeft + (slider.offsetWidth / 2);
    sliderTrack.style.setProperty('--fill-width', `${fillWidth}px`);

    // 更新拼图块背景位置，保证随滑动保持正确图像片段
    const bgX = gapLeft - mappedPuzzleLeft;
    puzzlePiece.style.backgroundPosition = `-${bgX}px -${gapTop}px`;
  }
  
  // 结束拖动
  function endDrag(e) {
    if (!isDragging) return;
    
    isDragging = false;
    slider.style.transition = 'all 0.22s';
    sliderTrack.classList.remove('active');
    
    // 移除拖动样式
    slider.classList.remove('dragging');
    puzzlePiece.classList.remove('dragging');

    // 计算当前拼图端的位置以判定是否成功
    const currentSliderLeft = parseInt(slider.style.left) || 0;
    const mappedPuzzleLeft = Math.round((currentSliderLeft / Math.max(1, sliderMax)) * puzzleMax);

    // 验证结果
    if (verifySuccess(mappedPuzzleLeft)) {
      // 验证成功
      slider.classList.add('success');
      puzzlePiece.classList.add('attached');
      verifyMessage.textContent = '验证成功，正在跳转...';
      verifyMessage.className = 'verify-message success';
      
      // 拼图块吸附效果：移动到缺口并将背景位置置为 0 对齐
      puzzlePiece.style.transition = 'left 0.36s ease-out, transform 0.3s';
      puzzlePiece.style.left = `${gapLeft}px`;
      puzzlePiece.style.backgroundPosition = `0px -${gapTop}px`;

      // 滑轨填充拉满
      sliderTrack.style.setProperty('--fill-width', `${sliderTrack.offsetWidth}px`);

      // 将 slider 移动到映射后的目标位置，以保持视觉一致
      slider.style.left = `${expectedSliderLeft}px`;

      // 延迟跳转，保留吸附视觉
      setTimeout(() => {
        window.open(currentTargetUrl, '_blank');
        hideModal();
        // 重置拼图块过渡效果与样式
        puzzlePiece.style.transition = '';
        puzzlePiece.classList.remove('attached');
      }, 700);
    } else {
      // 验证失败，重置
      verifyMessage.textContent = '出错，请重试';
      verifyMessage.className = 'verify-message error';
      
      // 失败动画：短暂抖动
      slider.style.transition = 'all 0.28s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
      puzzlePiece.style.transition = 'all 0.28s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
      
      const currentLeft = currentSliderLeft;
      const shakeLeft = Math.min(currentLeft + 10, sliderMax);
      slider.style.left = `${shakeLeft}px`;
      // 映射到拼图端
      const mappedShake = Math.round((shakeLeft / Math.max(1, sliderMax)) * puzzleMax);
      puzzlePiece.style.left = `${mappedShake}px`;
      
      // 更新背景位置，避免视觉错位
      const bgX = gapLeft - (parseInt(puzzlePiece.style.left) || 0);
      puzzlePiece.style.backgroundPosition = `-${bgX}px -${gapTop}px`;
      
      setTimeout(() => {
        slider.style.left = '0px';
        puzzlePiece.style.left = '0px';
        sliderTrack.style.setProperty('--fill-width', '0px');
        // 1秒后刷新拼图
        setTimeout(() => {
          slider.style.transition = '';
          puzzlePiece.style.transition = '';
          initPuzzle();
        }, 800);
      }, 260);
    }
  }
  
  // 窗口大小变化时重新计算尺寸
  window.addEventListener('resize', function() {
    if (modal.style.display === 'flex') {
      calculateContainerDimensions();
      // 重新计算映射与目标位置
      expectedSliderLeft = Math.round((gapLeft / Math.max(1, puzzleMax)) * sliderMax);
      // 重新设置拼图背景
      if (imageUrl) {
        puzzlePiece.style.backgroundSize = `${containerWidth}px ${containerHeight}px`;
        // 也重置拼图位置，保持当前 slider 映射一致
        const curSliderLeft = parseInt(slider.style.left) || 0;
        const mappedPuzzleLeft = Math.round((curSliderLeft / Math.max(1, sliderMax)) * puzzleMax);
        puzzlePiece.style.left = `${mappedPuzzleLeft}px`;
        puzzlePiece.style.backgroundPosition = `-${gapLeft - mappedPuzzleLeft}px -${gapTop}px`;
      }
    }
  });
  
  // -------------------------
  // 新增：页面底部 IP 查询并展示（替代示例中的 jQuery 代码，使用 fetch + 超时）
  // 注：IP 显示位置保持不变（index.html 中的 #ipsb），仅在此处赋值。
  // -------------------------
  (function fetchAndShowIP() {
    const ipsb = document.getElementById('ipsb');
    if (!ipsb) return;

    const url = 'https://api-ipv4.ip.sb/geoip';
    const timeoutMs = 5000;

    // 辅助：fetch 超时封装
    function fetchWithTimeout(resource, options = {}) {
      const { timeout = timeoutMs } = options;
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeout);
      return fetch(resource, { ...options, signal: controller.signal })
        .finally(() => clearTimeout(id));
    }

    fetchWithTimeout(url, { timeout: timeoutMs })
      .then(resp => {
        if (!resp.ok) throw new Error('Network response was not ok');
        return resp.json();
      })
      .then(data => {
        // data expected: { ip: 'x.x.x.x', country: '...' }
        ipsb.innerHTML = `${data.ip}&nbsp;|&nbsp;${data.country}&nbsp;&nbsp;`;
      })
      .catch(() => {
        // 与提供的 jQuery 示例行为一致：出错时显示失败信息
        ipsb.innerHTML = "<font color='red'>链接失败</font>";
      });
  })();
  // -------------------------
  // 以上为新增 IP 查询逻辑（注释标注）
  // -------------------------
});