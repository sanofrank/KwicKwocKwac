function minifyHTML(targetElSelector = 'html', removableElSelector = '', imgSourcePrefix = '') {
    // make sure that targetElSelector represents a "single" DOM element
    let fullHtml = $('<div>').append($(targetElSelector).clone());
    fullHtml.find(removableElSelector).remove();
    $.each(fullHtml.find('style'), function(index, obj) {
      let newCSS = $(obj)
        .html()
        .replace(/\:\s*/g, ':')
        .replace(/\n/g, '')
        .replace(/\s\s/g, '')
        .replace(/\;\}/g, '}');
      $(obj).html(newCSS);
    });
    $.each(fullHtml.find('[style]'), function(index, obj) {
      if ($(obj).attr('style').trim().length <= 0) {
        $(obj).removeAttr('style');
      }
    });
    let asdd = fullHtml
      .html()
      .replace(/\n/g, '')
      .replace(/\s\s/g, '')
      .replace(/(\s\>\s)|(\s\>)|(\>\s)/g, '>')
      .replace(/(\s\<\s)|(\s\<)|(\<\s)/g, '<')
      .replace(/(\s\{\s)|(\s\{)|(\{\s)/g, '{')
      .replace(/(\s\}\s)|(\s\})|(\}\s)/g, '}');
  
    return asdd.replace(/src\=\"/g, 'src="' + imgSourcePrefix);
  }