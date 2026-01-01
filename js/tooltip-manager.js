class TooltipManager {
  constructor() {
    this.activeTooltip = null;
    this.hoveredElement = null;
    this.hoverTimeout = null;
    this.init();
  }

  init() {
    document.addEventListener(
      "mouseenter",
      this.handleMouseEnter.bind(this),
      true
    );
    document.addEventListener(
      "mouseleave",
      this.handleMouseLeave.bind(this),
      true
    );
    document.addEventListener("scroll", this.handleScroll.bind(this), true);
    window.addEventListener("resize", this.handleResize.bind(this));
  }

  handleMouseEnter(e) {
    const container = e.target.closest(".tooltip-container");
    if (!container) return;

    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
    }

    const tooltipBox = container.querySelector(".tooltip-box");
    if (!tooltipBox || !tooltipBox.textContent.trim()) return;

    this.hoverTimeout = setTimeout(() => {
      this.showTooltip(container, tooltipBox.textContent);
    }, 100);
  }

  handleMouseLeave(e) {
    const container = e.target.closest(".tooltip-container");
    if (!container) return;

    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
      this.hoverTimeout = null;
    }

    this.hideTooltip();
  }

  showTooltip(element, text) {
    this.hideTooltip();

    const tooltip = document.createElement("div");
    tooltip.className = "tooltip-box visible";
    tooltip.textContent = text;
    document.body.appendChild(tooltip);

    this.positionTooltip(tooltip, element);

    this.activeTooltip = tooltip;
    this.hoveredElement = element;
  }

  positionTooltip(tooltip, element) {
    const elementRect = element.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const spacing = 4;

    let left = elementRect.left + elementRect.width / 2 - tooltipRect.width / 2;
    let top = elementRect.bottom + spacing;

    if (left < 10) {
      left = 10;
    } else if (left + tooltipRect.width > viewportWidth - 10) {
      left = viewportWidth - tooltipRect.width - 10;
    }

    if (top + tooltipRect.height > viewportHeight - 10) {
      top = elementRect.top - tooltipRect.height - spacing;
      if (top < 10) {
        top = 10;
      }
    }

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  }

  hideTooltip() {
    if (this.activeTooltip) {
      this.activeTooltip.remove();
      this.activeTooltip = null;
      this.hoveredElement = null;
    }
  }

  handleScroll() {
    if (this.activeTooltip && this.hoveredElement) {
      const rect = this.hoveredElement.getBoundingClientRect();
      const isVisible =
        rect.bottom > 0 &&
        rect.right > 0 &&
        rect.top < window.innerHeight &&
        rect.left < window.innerWidth;

      if (!isVisible) {
        this.hideTooltip();
      } else {
        this.positionTooltip(this.activeTooltip, this.hoveredElement);
      }
    }
  }

  handleResize() {
    if (this.activeTooltip && this.hoveredElement) {
      this.positionTooltip(this.activeTooltip, this.hoveredElement);
    }
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    window.tooltipManager = new TooltipManager();
  });
} else {
  window.tooltipManager = new TooltipManager();
}
