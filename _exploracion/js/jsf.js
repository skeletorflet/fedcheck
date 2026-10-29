var MOUSE_OVER_ROW_COLOR = '#EAF0F8';
var xOriginalRowBackgroundColor;
function rowMouseOverWithBGColor(pRow)
{
	xOriginalRowBackgroundColor = pRow.cells[0].style.backgroundColor;
	for(var j = 0; j < pRow.cells.length; j++)
	{
		pRow.cells[j].style.backgroundColor = MOUSE_OVER_ROW_COLOR;
	}
}
function rowMouseOutWithBGColor(pRow)
{
	for(var j = 0; j < pRow.cells.length; j++)
	{
		pRow.cells[j].style.backgroundColor = xOriginalRowBackgroundColor;
	}
}

function rowMouseOver(pRow)
{
	pRow.style.backgroundColor = MOUSE_OVER_ROW_COLOR;
}
function rowMouseOut(pRow)
{
	pRow.style.backgroundColor = '';
}

function rowShowIcon(obj){
	jQuery(obj).find('.noRenovarIcono', this).css('background-position', '-32px');
	}

function rowHideIcon(obj){
	jQuery(obj).find('.noRenovarIcono', this).css('background-position', '0px');
}