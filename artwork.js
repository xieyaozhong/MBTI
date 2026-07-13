(() => {
  const ARTWORKS = {
    INTJ: 'data:image/webp;base64,UklGRsQEAABXRUJQVlA4ILgEAAAQIQCdASqgAKAAPwF8tFQrJ6UjJdY6iWAgCWdu3V4hxo4jdoB3H/wXG0wzHLK3RwvYyvIC/09JIKniAyTLfW/AFV0xX98lGCiKzhq/+xwNVFD9LtoviUPGvnylf+BDiqwfPWyy4rt0fJTqmL89hUFuOUP+pJ9AE4cDOfYMQH46Hopkf4MYDmQ/XHXhXTdqoQzUSBRhv1cNktZ80jNG+03JTkskeFiVgCwfgDuTkMkC05TgJ8iM94p+W6Mndf4u0JLSle/i5TYiwP7fSbEe5Fn8LRX6h+e+sADXGeVDiI7zw7QS5AppXdhCftUPYqSVpthWWxdtn7udCCg3mYKcXkyRk2DwmbkOclAyEAkX3WVEJwAA/u93fPG80U2cww2ziNX8SwtS6M3Mr288yZ1pilcwhyTm6ioIzzhDYbOxVV4Ea6rXeheKpa25bS4AncxN1BNHYXMDdv3vht2quk+hjChv1f0vsizahZiAxEWZdxlBqD5SjACORcyFAFABAAZCF+i5VEEsvCEeheLt4mrjrbu1UWDWGKT+BFN4hDsZSOFQXBXITq3sKTz3gXgn+8n03oTDDcvp9P1f6hr4ojWUAmd3g39En7o9t61q4bmcZTQCdboNTveR0ZtJS8lDtMNVDTtPuSlddCpg0ed8OmCRfWmG2qeSXucpUR67FpqwtfkuBbciGGjtRX8DjAha7gcvrepRfcMPiIqOzbupxSQdJEVSZeeqZ/DBGouBdSzp5h32w6jeGh1Ybley1ob81ycw4hjlm0x1ai/GXbmXh8NQRL2Nvra8hup9p96aoWf0/8lD52eGEO/DAMUgACk2PruVnJgL2osk8vYsRuadLhfKFble3dAY3Jg+YPdNL9rSNqJBxBLP4clss9C5eOBd1pJYwbm5c5Rn0D1tM66c6qKobmxtudvB9HhZyHdXbZfMdO8b23gG2WesAKP6npmU1pQ15UX//awb/85SJAd3xYqSqoQVMjmiU25ruxm4oIcVKEfOdw80SQKOR+S5zYaZdic7bwo9L7c2kzGO9Scpd1cn4yh0TusoPRC/OaAXQsTY7jlAA3DTWjS27ROHecXmjNpmgbsgk/fS0reIRVoP46FkjUeGGv6vW7RdNC6jPRNeqBUG6atj4B7iyW/+SkRV7ksiWVrsG0+vCQuoL20tQLObRz3LP/mnQ40JEYV3/IqtlZ6gZwp1HkzUSHc3qZJKpX5Sb2+CqclgbhGuWDjIPMlIlj0I8bbtYHETO+WUcHHZ0bqq5c83dRpExaL6ZTTmHsVuHFF/radG6rTLgfKCVWoKEVBk6jk+Be5MIZ28tynEuq/FIKQnqUC5Oo1bwrU3zCfwf2r1q7cQ9PCB6OkAoQnqRpFbsIXhkkX47pHlFxZqSOOG+Bn0e1AOShBpmTOIB3Z9EFalxc++n59yaUeuhjNMYJdOdp15MP5aJdi9U3AL3rhmU+0bU1SHwoRmew+0feLrY1a8+zDQujSI4zxYdRIcPsydJgC98mPLSTfM/SEHgKFBkLvcLpfuRvAKOaIOtpru4DSVadpB39PIjpFdfD7vMIbpN+hKFKlO6CUtccrPTd6PQB2fg/nTp6j4TlVuoXy6Jg20CkBHcKWQAA==',
    INTP: 'data:image/webp;base64,UklGRpwEAABXRUJQVlA4IJAEAACQHgCdASqgAKAAPwF4tFQrJySjJtbaOWAgCWVu3V6K6VF2j1V1OtWcGmPN32LfCg7d197Ib95QO5O+hXTUX0Knd9ikRgWfnOjaltrsZQhw6qG1yB/2X2zlRGwstxzpIjhxCkX4yViLFvLeTEIY2A+yBFW3WwagN/1RC5zCSOeliu9mCDyj6u7qjjmJjNoNCNj4kSR59Rfzl+uVv4N14SI+ObJb/wvNx0rqiegZB4b5AAtIreralJXyyaJrD93vh/fDXd98PY/nKnsyEpV513fl9aq7ykTPFFsNWEYZ3/NV3IRCGa/jjh87l0U4+7Guc1GePwO4s+pHUVll7sMAAP7vvd+Caa+hijG/wpCkpLF1w1nYU4iz8KsKsBPpQTkvHAgfRz3sxBHcT90KDm90nybtGvPigctkX/h6xtYOwLiFwQmIOAvDa5tdivwSx6mgaKO2svhD1oVbt9UXVc9Rctc2S7jT6qSFVPJrt3/8w5RvQGSrMBMgdl8XXzc9bkZQu0MQkjgN0rXrOe3PJ8FdaI3wTzdK+e4EIrHlJbUbVV8eapDBA4FP/mRXAehwehYMuRimLua2CvAmorjKmekMVvnTWLiqOBGUYbZ/vC/HDv1F4bJ3L0NlpKBty3oIOZOngUvbpIS2d4fJ5JY3XoeH7Mf43CEwF8sUTTRsaFR77/xmr5LwEouveGMWiN/vqdS8IfUpIdRD2rYCojkeIIbBW1J4S/4fgo+O9M15ccA1u/nyV+Ns+6p08gcdC5tqWfWpGl6YZ08QJOnFZFZBAFNByG2iZH3Ijnyb6PWsh4o9nF791FkwOXRkIJxD5QTdKBZaXenITykPv71em/9PTbvBnufDSX0gWLDMKUYLgyCfFUWsA0hBxep2d5AWWB/90nIb5SU2q0ZFm0hugN+JkQxbuNOMSKt+VJglYpbRhIL7TF8NQ9gUrX3VRz8lSxXbkaEIJI8VzbUVQ8ZZ1wi3RGJ5xDNhgu1qrIrOqhsNjPxstlcrCamGJJRtD0QYTYKIgycRHrjWan49TZrf953wMIQrojN/uLYvzPXlveBjpBlFoVgbd96z/iTY50cdmBnIRUm5rZaSEpZukvkjjsnOjjmCA6Rw7lUT0h3xIkyQRdyBcT6KUxnzID0Y8G5WVQrnPUTmIo8h+CYNvTKXFWWYb6bhOxNYvU4Kt51Y89JsJPUo5iWa/KJhk93e7BK9TstasHN3AL402ACF+vYESavlW0mpTaKwFeMYJVy3oUYDDhy6dDmZiNNTKG0/n04uMuOcNUk0YnHQJyM6AbetKk6U0TCrQR4AP8ND0EqsBunKFS5UdkeykympEBJ+w8H9ez7dbu/PXor1xmNCJFubkAMkKVnQR11w3qtx7P8RrRW4Axgu95IXrhwqhFMOc5OJex2UXQSfjoLHxqqmS1Wqc+nRxkeLBQsc8J1KgCedifNr3dGAyG9MDVmHv/k65ZpwKSmzBAlBOHNhH/bu4Ao6dYHst3if+r8DGRk9R5sklf65gzLdrf183YWiQGB7h5Lm4WO3UQYz5IKZIL87klT7wIPsBUsS5AgA',
    ENTJ: 'data:image/webp;base64,UklGRtAGAABXRUJQVlA4IMQGAABwKACdASqgAKAAPwFysFKrJqQjqPUsGWAgCWcA1Br49i4b77jf5vjWoEmznWJWgPtmy+ke+evpyDnrKEG/Hwk/0SoYzThlKJJNg5eSA+O91uE+5VLkb3ue30Isj0iepsB5H0MGjPIkmnSbGK4oHTUMhvR1DXGa+KjF6gCVfMXaOPXDGAelJQkJtj7D8NMNvwzt3ZiB7WbUxqCEO2TVEtvnWmWASTqcv6Re9+LBI+zachHik82SITSayBklTy2tTkaiGvZEnqdAeFeCxEbnFeTEewIn43Tfw3uG83ndWVuwOCfj+yi5RDPDTU/VVCGTvhAwKl317iG9wbdpz1gP9p9pR8CFDJYvozROYJEXpw7Bz2/dqFNRH7nrIOvIfMfYn970g72is6nWOUYGEzFOkXLNmApLYpnya3Kgf6ot1vu8dfsHeQt6MHc86I+EAAD+8BvflXq8sKjviTaghzeO5SPpOf8p7RZK38xszw9bCtTIcg0a3qYf1uxRtV4G/DYdcn0xJ7mycVXe3bzbQa9J6Fg8y3lwIsEXxF5w390+kqVR0yppOsIAmAHe012Y6S3UKERbsTPoh2N42/+JC1IhfRgsJnDnLHDAt3OV6DKARbdl14rfB0XQUPnExT/ZrixcspasnFGfHm6u5ShbVlmut5BCw9Hiol3+eBIkd35OBKSp+ALHQV8cv9C9WRqH7oHU3t/iZ1Dc9kwgx/OSoCPbCoHbMYGZx4UsEiAiCe6WHwFcFb7pKnVjqI0z1k145Yp8JkhArBISUotGbRFvWGFjc/2DG0kylZVwIZdYBIeeyBtHEvQwgKWsPHO7VKpOH9LDOPTMk52NrE6FrO9+FevePLDSa4Rs1tgyrHY7RcfpycDlUyGTI5kffvB4ZaCPugG/EO8/ctTq1Q48v1lLu3ULB9eqDSYDOzetYu/oRmLJbHNw7OoEVbOTkTmcXT0l/5uDRa00cBrX6YCAGZL49pXfxWXVDXMF42uqqabdTD5CIaNgTim/NRSG13qHJrb4BFfPGKb45X0zGH9jl/6c2r5FA69BQchV+/DqHvXalUYf2ulaehyhQSRAfdTSlEuviZGO0BD4Nl0eX1x3vf6CglsOib8ji+wN+LxdAZxNdjIqMf243PCGkKIDiAPVgjkTQW5lzTjMjXmZOo3f410FX2HNEWg+ELo+ufmhd5ToCfQMPnvIAs0KSfTy05rlKHRpl1sFf8S6S2swPMg0/kVsJs3FlEKHS15DCECLUvudajQ80+svchRFw6owwq2a2EYlJrDYyiKutH8qRKw6C/JcgVw4ZqzfIaAYA53qsCwtB9lCC2js2Y9DybYM0nXg0e2y3gW37SAn7GFt+nFa0MJndj98WOjVvp/BKjIOPJwboYs2ySz3VJz1vbgoSMcshTQV+KBW70LvmkPpMW0OiwpVUI76bnw39zxe3FR4QADburMFsx5MOvV67eku0qYcVmTVE3mIbK59HBd2+M+OS7BKF+VOqmosVXaydP5fU4CRZtpRyzcVmYPucqYhCNJYf3WRqOdcrunqeY64f/+tzUCurzYkzjDeVWFpB1ygpGbZ4w9t1ppaJCFPmKCWePmjW4GwfoNhOEpD4WE/WDQC6PaF9NreV3Or8t1O3X5/7t8OP6u20QTSDcTgkGONLMkbCX54UNJnZzb1GyyidzAxU3h36Kiy1RGTfYl4wBh0c4Y+sxNpCiY809n6tsmte1ZvFzd4OTJKxrs3Ig0YncQ6KYnyEXGC4mhd1bF0YAcuj1kuuHRshKx1BA7u5C6i9aV64nhfTIupYQ69/FFOqOWdS6sW/2B2VPpobtIcjwQCZPca4XatmaFLuZNCnLA75/gwGJ4xYB9o4iv3pzUWzBNzXTJd5qa+hccYnPiQUnKNqHDMkCnFKf6q0Y+1yNzm43iZp4YBA7UZPDYZ25a1B/CeMVtRJ9cqxVNevAOBWs/J+ZdZfWH/8AcGKZ80k4cHFlVPW/tW6+jugRcxe4ztTB8LrM0DUQVO3seFmfnQBDkKm+MoCrorI1388IqbyksRwgRfYnDMY8/nS4HuhgPLJQ3F/UkIO/MSdJfiM7Kboq/t5StPHrx2kpSMhiXK8TWb8zLCeUtPYQw4UeEw52N8My3wFEqz9p3T9+NCp9g6JVVeVqjgHvtOwjzHhBV4NkSIPZLDT1NMjefYcTKY4an6vrWDRY3f3iXNJOBYyxl+S5G4i8TpWr1r4NJ/xWCNDxBa45SC1EXkm5M6oJKTgfuNrxHISt23oFbtWa+p7P4nXdvc73KrbwT5YaGjKum1UFr9qxswvm1TDqUCwlLbFIAA',
    ENTP: 'data:image/webp;base64,UklGRnQEAABXRUJQVlA4IGgEAAAQHgCdASqgAKAAPwF6s1SrJ6QkJnQKaWAgCWVu3V4FYfy89OW00SPX549xSccZJluC5de5uRAxqG+4N5MO8AznJB3gk8M38jR1sLyYPMYRIeUT6vWOCbXcaU4DHs2Rim+4av12+M5DTl1smy1ou8ZLektkSHW2YtF561pCaZcnRi8x61/H07ManP9Fod4VafNpyOkiJPoUJ+MC3PSflR6evrX59QHaQX2HW6RlwFEPujgbYbr9p3Izjk5e2QKG28VEeqGJrvHAFxWYdpRHuymd0R1v0Pkn5yvnR1Bh6qLEZgNxvAsXTJuMvLHZiymQ/6pORFG8O6tyuAAA/u+931WQ+tUIhrBwbq0TgZbyv50fTe/9XvCD/G1eu5iowERVkcTViV+DrBkF+Buuj+cWizmaKFrS4RuKpEzd7exchA1utduxYKOI3trCvZTW7Pp77Vg1mxop+NTaAB8c/6eaRRjh1HZGESw7jV1qo1AvdQdiT1DEDmt9D3x9hGTM7BAjL7/bDAfKSPLKSrov5XhIt1FhouC94bIlXvzrEErX1WBQsQoCL8IvQmHDvtKRNd062yfgOL1wlC8TQjPODU1e3FI4nHQdRT9xUkaWg4RqfhSvOpDyOdy/dP29qVefezNBQ1OCwWsNIeGR0nvZch881K2crnOtm2C9f8cXZvj5QG304QhBXD/QjTncNL8GABZBVwasRfkZMyWrwk4PC5TDHLZnNO5VklmzoCw3BF23n6vcKm6pW5ZuBkmlTUJ7q2obEh3k/K9Atlzh4jVoFmb6FJsViaRjKhUQKN3wVfKBeJngcpYo0sQsmH6mKZPfrbHZPWZUtqhcNWW8dt7EWV5GC5Tk4/BOQbUhvqn4gxQ/s06/yBDaXySmn5x21xvtMAEjR+B8s43Y0TVtAAMeApIqKGDd0FYuLcqRDF53DgV+a6YgZ7Q77aMTN76QuNXWNWqNRFOHOrc+in57gCyz5sUvM/gR6X/zOS577cd5+1BSi/jviX+qRSBxaKXUT3pULMQ+qZCI7kD3I4TAq/1zsQA+63uyMqfQcfNt8kuucpPNn7WTlteDkRLnkS1XsijXNvcA8jFWckJXIvTy6OpgGNBxePavcttqu47lHRLjrPFFjIcxLZKAYiMhxKApdVkNZN7qR+17B+pUeMtgp3EfX6yDLvy6g3wPFr/Sx444LHeKf+k6lVT5RjWRYZ0SR+phYeQxIqVKhCqsTkis5kg6sNzOb2aDGe76m+zc/h/sNozIw5xNGFF+KevNwtr2dYewkwWxgpzH3H4g1ppT2BmJZWanTt+6/uEoB56/+CwFVqYbrUQJJhl/XxsyJiWif6+nQsjJTUKuGYNbktNO/7AdfqO8i0IHLnrYvowXswn+q2IZfHx2sA9Buz+8KguAWb9UgoVIRwUi6bec9kpDG9rjvKuMV/Lmo311CBQ1WKzF6V5nlU2peIiju2L7mbMPqhsvRi6RyCFqbuBxCICpaPJ42a8aQ8Af7dgw3IAAAAA='
  };

  const style = document.createElement('style');
  style.textContent = `
    .frame{position:relative;isolation:isolate}
    #avatar,#avatarImage{width:100%;height:100%;display:block}
    #avatarImage{object-fit:contain;object-position:center;background:radial-gradient(circle at 50% 28%,#443471,#100d1d 74%);image-rendering:auto}
    #avatarImage[hidden],#avatar[hidden]{display:none}
    .frame.artwork-active{border-color:#9278dc;box-shadow:0 0 0 1px #ffffff18,0 18px 45px #080611aa}
    @media(max-width:700px){.frame{max-width:420px;margin:0 auto}}
  `;
  document.head.appendChild(style);

  const frame = document.querySelector('.frame');
  const canvas = document.querySelector('#avatar');
  const image = document.createElement('img');
  image.id = 'avatarImage';
  image.hidden = true;
  image.alt = 'MBTI 人格代表角色';
  frame.prepend(image);

  function showArtwork(type) {
    const src = ARTWORKS[type];
    if (!src) {
      image.hidden = true;
      image.removeAttribute('src');
      canvas.hidden = false;
      frame.classList.remove('artwork-active');
      return;
    }
    image.onload = () => {
      canvas.hidden = true;
      image.hidden = false;
      frame.classList.add('artwork-active');
    };
    image.onerror = () => {
      image.hidden = true;
      canvas.hidden = false;
      frame.classList.remove('artwork-active');
    };
    image.alt = `${type} ${P[type][0]}角色圖`;
    image.src = src;
  }

  const originalResult = window.result;
  window.result = function () {
    originalResult();
    showArtwork(state.type);
  };

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  function drawContained(ctx, img, x, y, w, h) {
    const scale = Math.min(w / img.naturalWidth, h / img.naturalHeight);
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  }

  async function enhancedCard() {
    const p = P[state.type];
    const cardCanvas = document.createElement('canvas');
    const ctx = cardCanvas.getContext('2d');
    cardCanvas.width = 1080;
    cardCanvas.height = 1350;

    const gradient = ctx.createLinearGradient(0, 0, 1080, 1350);
    gradient.addColorStop(0, '#292145');
    gradient.addColorStop(1, '#0e0b19');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1080, 1350);

    const src = ARTWORKS[state.type];
    if (src) {
      try {
        const art = await loadImage(src);
        drawContained(ctx, art, 250, 50, 580, 580);
      } catch (error) {
        const fallback = document.createElement('canvas');
        draw(fallback, state.type, 24);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(fallback, 300, 90, 480, 480);
      }
    } else {
      const fallback = document.createElement('canvas');
      draw(fallback, state.type, 24);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(fallback, 300, 90, 480, 480);
    }

    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd166';
    ctx.font = '900 130px monospace';
    ctx.fillText(state.type, 540, 700);
    ctx.fillStyle = '#fff8e8';
    ctx.font = '700 54px sans-serif';
    ctx.fillText(p[0], 540, 780);
    ctx.fillStyle = '#72ddf7';
    ctx.font = '700 30px sans-serif';
    ctx.fillText(p[1], 540, 850);
    ctx.fillStyle = '#bcb3d4';
    ctx.font = '30px sans-serif';
    ctx.fillText((state.name || '我的') + '像素人格', 540, 960);

    p[3].split(',').forEach((trait, index) => {
      ctx.fillStyle = '#ffd166';
      ctx.fillRect(120 + index * 290, 1050, 250, 65);
      ctx.fillStyle = '#201609';
      ctx.font = '700 28px sans-serif';
      ctx.fillText('# ' + trait, 245 + index * 290, 1093);
    });

    ctx.fillStyle = '#81799a';
    ctx.font = '24px monospace';
    ctx.fillText('PIXEL TYPE LAB · MBTI STYLE TEST', 540, 1260);

    const link = document.createElement('a');
    link.download = `${state.name || '我的'}-${state.type}-像素人格.png`;
    link.href = cardCanvas.toDataURL();
    link.click();
    toast('結果卡已下載');
  }

  document.querySelector('#download').onclick = enhancedCard;
})();
