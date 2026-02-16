# AUTO_INSTALL_SMART_HOME_v2.ps1
# Автоматическая установка умной кнопки Домой v2
# Определяет домашний URL по текущему URL кабинета если нет referrer

$indexPath = "C:\dev\2. HayatiBank\3. HayatiBankBot\webapp\w-v39-premium-steps-to-fbh\index.html"

Write-Host "🔍 Проверяю файл..." -ForegroundColor Cyan

if (!(Test-Path $indexPath)) {
    Write-Host "❌ Файл не найден: $indexPath" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Файл найден!" -ForegroundColor Green

# Читаем файл
$content = [System.IO.File]::ReadAllText($indexPath, [System.Text.Encoding]::UTF8)

# Проверяем что скрипт еще не установлен
if ($content -match "Smart Home Button v2.0") {
    Write-Host "⚠️  Скрипт уже установлен!" -ForegroundColor Yellow
    exit 0
}

# Удаляем старую версию если есть
if ($content -match "Smart Home Button v1.0") {
    Write-Host "🔄 Удаляю старую версию..." -ForegroundColor Yellow
    $content = $content -replace '(?s)<script>\s*/\* Smart Home Button v1\.0 \*/.*?</script>\s*', ''
}

Write-Host "📝 Добавляю умную кнопку v2..." -ForegroundColor Cyan

# Скрипт для вставки
$smartScript = @"

<script>
/* Smart Home Button v2.0 - с определением по URL кабинета */
(function() {
  'use strict';
  
  function detectHomeUrl() {
    const referrer = document.referrer;
    const currentUrl = window.location.hostname;
    const currentHomeUrl = localStorage.getItem('hayati_homeUrl');
    let detectedUrl = null;
    
    // Сначала проверяем referrer (если перешли с сайта)
    if (referrer) {
      if (referrer.includes('hayatibank.ru')) {
        detectedUrl = 'https://hayatibank.ru';
      } else if (referrer.includes('хаяти.рф') || referrer.includes('xn--80aq3ak5c.xn--p1ai')) {
        detectedUrl = 'https://хаяти.рф';
      }
    }
    
    // Если нет referrer - определяем по URL кабинета
    if (!detectedUrl) {
      if (currentUrl.includes('cabinet.hayatibank.ru') || 
          currentUrl.includes('cabinet-hayatibank.web.app')) {
        detectedUrl = 'https://hayatibank.ru';
      } else if (currentUrl.includes('кабинет.хаяти.рф') || 
                 currentUrl.includes('xn--80acmlhv0b.xn--80aq3ak5c.xn--p1ai')) {
        detectedUrl = 'https://хаяти.рф';
      } else {
        detectedUrl = 'https://хаяти.рф'; // fallback
      }
    }
    
    // Обновляем если нашли новый источник
    if (detectedUrl && detectedUrl !== currentHomeUrl) {
      localStorage.setItem('hayati_homeUrl', detectedUrl);
      console.log('🏠 Home URL updated:', detectedUrl);
      return detectedUrl;
    }
    
    // Используем сохраненный или дефолтный
    return currentHomeUrl || 'https://хаяти.рф';
  }
  
  function initSmartHomeButton() {
    const homeUrl = detectHomeUrl();
    const homeButton = document.querySelector('.home-button');
    
    if (homeButton) {
      homeButton.href = homeUrl;
      console.log('🏠 Home button set to:', homeUrl);
    }
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSmartHomeButton);
  } else {
    initSmartHomeButton();
  }
})();
</script>
"@

# Вставляем перед </body>
$content = $content -replace '</body>', "$smartScript`n</body>"

# Сохраняем
[System.IO.File]::WriteAllText($indexPath, $content, [System.Text.Encoding]::UTF8)

Write-Host "✅ Скрипт v2 успешно добавлен!" -ForegroundColor Green
Write-Host ""
Write-Host "🎯 Логика работы:" -ForegroundColor Cyan
Write-Host "  • cabinet.hayatibank.ru → кнопка домой → hayatibank.ru" -ForegroundColor White
Write-Host "  • кабинет.хаяти.рф → кнопка домой → хаяти.рф" -ForegroundColor White
Write-Host "  • referrer перезаписывает при переходе с сайта" -ForegroundColor White
Write-Host ""
Write-Host "📦 Теперь выполни:" -ForegroundColor Yellow
Write-Host "cd `"C:\dev\2. HayatiBank\3. HayatiBankBot\webapp\w-v39-premium-steps-to-fbh`"" -ForegroundColor White
Write-Host "git add index.html" -ForegroundColor White
Write-Host "git commit -m `"feat: умная кнопка Домой v2 (определение по URL)`"" -ForegroundColor White
Write-Host "firebase deploy --only hosting:cabinet" -ForegroundColor White
