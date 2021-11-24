import { Component, RenderableProps, ComponentChild } from 'preact';

interface IconProps {
  name: string;
}
export class Icon extends Component<IconProps> {
  render(props: RenderableProps<IconProps>): ComponentChild {
    return <i class="material-icons-round md-36">{props.name}</i>;
  }
}

interface LinkProps {
  href: string;
  icon?: string;
  ariaLabel?: string;
}
export class Link extends Component<LinkProps> {
  render(props: RenderableProps<LinkProps>): ComponentChild {
    return (
      <a rel="noopener" target="_blank" href={props.href} style="display:flex;" aria-label={props.ariaLabel}>
        {props.children}
        {props.icon ? <Icon name={props.icon} /> : undefined}
      </a>
    );
  }
}
