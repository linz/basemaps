import { Component, ReactNode } from 'react';

interface IconProps {
  name: string;
}
export class Icon extends Component<IconProps> {
  render(): ReactNode {
    return <i className="material-icons-round md-36">{this.props.name}</i>;
  }
}

interface LinkProps {
  href: string;
  icon?: string;
  ariaLabel?: string;
  children: ReactNode[] | ReactNode;
}
export class Link extends Component<LinkProps> {
  render(): ReactNode {
    return (
      <a
        rel="noopener noreferrer"
        target="_blank"
        href={this.props.href}
        style={{ display: 'flex' }}
        aria-label={this.props.ariaLabel}
      >
        {this.props.children}
        {this.props.icon ? <Icon name={this.props.icon} /> : undefined}
      </a>
    );
  }
}
